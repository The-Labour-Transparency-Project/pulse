using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Domain;
using Domain.Configuration;
using Domain.Identity;
using Domain.Responses;
using Infrastructure;

namespace Api;

public static class PulseEndpoints
{
    public static IEndpointRouteBuilder MapPulseEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/ping", () => Results.Ok(new { status = "ok" }));
        endpoints.MapGet("/ping/s3", PingS3);
        endpoints.MapPost("/token", RequestToken);
        endpoints.MapPut("/response", SaveResponse);
        endpoints.MapGet("/response/latest", GetLatestResponse);
        return endpoints;
    }

    private static async Task<IResult> PingS3(
        IS3Provisioner s3Provisioner,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        try
        {
            await s3Provisioner.EnsureExists(cancellationToken);
        }
        catch (S3OperationException exception)
        {
            var diagnosticId = Ulid.NewUlid();
            loggerFactory.CreateLogger("Pulse.S3").LogError(
                exception,
                "S3 diagnostic {DiagnosticId}: operation {Operation}, bucket {Bucket}, failure {FailureKind}, AWS error {AwsErrorCode}, HTTP status {StatusCode}, request {RequestId}",
                diagnosticId, exception.Operation, exception.Bucket, exception.Kind, exception.AwsErrorCode,
                exception.StatusCode, exception.RequestId);
            return Results.Json(new { status = "pending", diagnosticId }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception exception)
        {
            var diagnosticId = Ulid.NewUlid();
            loggerFactory.CreateLogger("Pulse.S3").LogError(exception, "S3 diagnostic {DiagnosticId} failed unexpectedly", diagnosticId);
            return Results.Json(new { status = "error", diagnosticId }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        
        try
        {
            await s3Provisioner.CheckAsync(cancellationToken);
            return Results.Ok(new { status = "ok" });
        }
        catch (S3OperationException exception)
        {
            var diagnosticId = Ulid.NewUlid();
            loggerFactory.CreateLogger("Pulse.S3").LogError(
                exception,
                "S3 diagnostic {DiagnosticId}: operation {Operation}, bucket {Bucket}, failure {FailureKind}, AWS error {AwsErrorCode}, HTTP status {StatusCode}, request {RequestId}",
                diagnosticId, exception.Operation, exception.Bucket, exception.Kind, exception.AwsErrorCode,
                exception.StatusCode, exception.RequestId);
            return Results.Json(new { status = "unavailable", diagnosticId }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception exception)
        {
            var diagnosticId = Ulid.NewUlid();
            loggerFactory.CreateLogger("Pulse.S3").LogError(exception, "S3 diagnostic {DiagnosticId} failed unexpectedly", diagnosticId);
            return Results.Json(new { status = "failure", diagnosticId }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<IResult> RequestToken(
        TokenRequest request,
        PulseSettings settings,
        IRespondentIdentityService identity,
        ITokenService tokens,
        ITokenLifetimePolicy tokenLifetimePolicy,
        TimeProvider timeProvider,
        IEmailService email,
        ISurveyCatalog surveys,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        if (!EmailAddress.IsValid(request.Email))
        {
            return Results.BadRequest(new { error = "The email address is invalid." });
        }

        var normalizedEmail = IRespondentIdentityService.NormalizeEmail(request.Email);

        if (!string.IsNullOrWhiteSpace(request.Token))
        {
            if (!tokens.TryValidate(request.Token, out var existingClaims) || existingClaims is null ||
                !settings.TryGetAllowedWave(existingClaims.WaveId, out var existingWave))
            {
                return Results.Unauthorized();
            }

            var refreshedRespondentId = identity.GetRespondentId(existingWave!.SurveyId, normalizedEmail);
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(refreshedRespondentId), Encoding.UTF8.GetBytes(existingClaims.RespondentId)))
            {
                return Results.Unauthorized();
            }

            var refreshed = CreateClaims(existingClaims.WaveId, refreshedRespondentId, tokenLifetimePolicy, timeProvider);
            return Results.Ok(new { token = tokens.Create(refreshed), iat = refreshed.IssuedAt, exp = refreshed.ExpiresAt });
        }

        if (string.IsNullOrWhiteSpace(request.WaveId) || string.IsNullOrWhiteSpace(request.SurveyId) ||
            !settings.IsAllowedWave(request.WaveId, request.SurveyId, request.SurveyVersion ?? ""))
        {
            return Results.BadRequest(new { error = "The survey or email address is invalid." });
        }

        if (!settings.IsWaveOpen(request.WaveId, DateTimeOffset.UtcNow))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var respondentId = identity.GetRespondentId(request.SurveyId, normalizedEmail);
        var credential = tokens.Create(CreateClaims(request.WaveId, respondentId, tokenLifetimePolicy, timeProvider));
        var accessUrl = $"{settings.RespondentBaseUrl.TrimEnd('/')}?t={Uri.EscapeDataString(credential)}";
        var surveyTitle = surveys.GetTitle(request.SurveyId, request.SurveyVersion ?? "") ?? "Labour Transparency Pulse";
        await email.SendAccessLinkAsync(normalizedEmail, request.SurveyId, surveyTitle, accessUrl, cancellationToken);
        loggerFactory.CreateLogger("Pulse.Token").LogInformation(
            "Access token requested for wave {WaveId}, survey {SurveyId}, respondent {RespondentId}",
            request.WaveId,
            request.SurveyId,
            respondentId);
        return Results.Ok(new { accepted = true });
    }

    private static TokenClaims CreateClaims(
        string waveId,
        string respondentId,
        ITokenLifetimePolicy lifetimePolicy,
        TimeProvider timeProvider)
    {
        var issuedAt = timeProvider.GetUtcNow().ToUnixTimeSeconds();
        return new TokenClaims(waveId, respondentId, issuedAt, lifetimePolicy.GetExpiry(issuedAt));
    }

    private static async Task<IResult> SaveResponse(
        HttpRequest request,
        PulseSettings settings,
        ITokenService tokens,
        ResponseDocumentValidator validator,
        IResponseRepository repository,
        IS3Provisioner s3Provisioner,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        if (!TryBearer(request, tokens, out var claims))
        {
            return Results.Unauthorized();
        }

        if (!settings.TryGetAllowedWave(claims.WaveId, out var waveDefinition))
        {
            return Results.Unauthorized();
        }

        if (!settings.IsWaveOpen(claims.WaveId, DateTimeOffset.UtcNow))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        if (request.ContentLength > settings.MaximumResponseBytes)
        {
            return Results.StatusCode(StatusCodes.Status413PayloadTooLarge);
        }

        JsonDocument document;
        try
        {
            document = await JsonDocument.ParseAsync(request.Body, cancellationToken: cancellationToken);
        }
        catch (JsonException)
        {
            return Results.BadRequest(new { error = "The response must be valid JSON." });
        }

        using (document)
        {
            try
            {
                validator.Validate(document.RootElement);
            }
            catch (ResponseValidationException exception)
            {
                return Results.BadRequest(new { error = exception.Message });
            }

            if (!document.RootElement.TryGetProperty("waveId", out var wave) ||
                wave.GetString() != claims.WaveId ||
                !document.RootElement.TryGetProperty("surveyId", out var survey) ||
                survey.GetString() != waveDefinition!.SurveyId ||
                !document.RootElement.TryGetProperty("surveyVersion", out var surveyVersion) ||
                surveyVersion.GetString() != waveDefinition.SurveyVersion)
            {
                return Results.BadRequest(new { error = "The response survey does not match the credential." });
            }

            var receivedAt = DateTimeOffset.UtcNow;
            var version = Ulid.NewUlid();
            var stored = new StoredResponse(
                claims.WaveId,
                waveDefinition.SurveyId,
                document.RootElement.GetProperty("surveyVersion").GetString() ?? "unknown",
                claims.RespondentId,
                version,
                receivedAt,
                document.RootElement.GetProperty("responseSchemaVersion").GetString() ?? "unknown",
                document.RootElement.Clone());
            try
            {
                await SaveWithProvisioningRetryAsync(
                    () => repository.SaveAsync(stored, cancellationToken),
                    s3Provisioner,
                    cancellationToken);
            }
            catch (S3OperationException exception)
            {
                var diagnosticId = Ulid.NewUlid();
                loggerFactory.CreateLogger("Pulse.S3").LogError(
                    exception,
                    "S3 diagnostic {DiagnosticId}: operation {Operation}, bucket {Bucket}, failure {FailureKind}, AWS error {AwsErrorCode}, HTTP status {StatusCode}, request {RequestId}",
                    diagnosticId, exception.Operation, exception.Bucket, exception.Kind, exception.AwsErrorCode,
                    exception.StatusCode, exception.RequestId);
                return Results.Json(
                    new { error = "Response storage is unavailable.", diagnosticId },
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            loggerFactory.CreateLogger("Pulse.Response").LogInformation(
                "Response version {ResponseVersion} written for wave {WaveId}, respondent {RespondentId}",
                version,
                claims.WaveId,
                claims.RespondentId);
            return Results.Ok(new { responseVersion = version, receivedAt });
        }
    }

    private static async Task<SavedResponse> SaveWithProvisioningRetryAsync(
        Func<Task<SavedResponse>> save,
        IS3Provisioner s3Provisioner,
        CancellationToken cancellationToken)
    {
        try
        {
            return await save();
        }
        catch (S3OperationException)
        {
            await s3Provisioner.EnsureExists(cancellationToken);
            return await save();
        }
    }

    private static async Task<IResult> GetLatestResponse(
        HttpRequest request,
        ITokenService tokens,
        PulseSettings settings,
        IResponseRepository repository,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        if (!TryBearer(request, tokens, out var claims))
        {
            return Results.Unauthorized();
        }

        if (!settings.TryGetAllowedWave(claims.WaveId, out var waveDefinition))
        {
            return Results.Unauthorized();
        }

        if (!settings.IsWaveOpen(claims.WaveId, DateTimeOffset.UtcNow))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var response = await repository.GetLatestAsync(waveDefinition!.SurveyId, claims.WaveId, claims.RespondentId, cancellationToken);
        loggerFactory.CreateLogger("Pulse.Response").LogInformation(
            "Latest response {Outcome} for survey {SurveyId}, respondent {RespondentId}",
            response is null ? "not found" : "retrieved",
            waveDefinition.SurveyId,
            claims.RespondentId);
        return response is null ? Results.NotFound() : Results.Ok(response);
    }

    private static bool TryBearer(HttpRequest request, ITokenService tokens, out TokenClaims claims)
    {
        claims = null!;
        var header = request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var credential = header[7..].Trim();
        if (credential.Length == 0 || !tokens.TryValidate(credential, out var parsed) || parsed is null)
        {
            return false;
        }

        claims = parsed;
        return true;
    }
}
