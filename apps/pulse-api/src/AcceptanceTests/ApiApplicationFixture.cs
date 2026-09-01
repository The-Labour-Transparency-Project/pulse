using Api;
using Domain.Responses;
using Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;

namespace AcceptanceTests;

public sealed class ApiApplicationFixture : IDisposable
{
    private readonly WebApplicationFactory<Program> application;
    private readonly WebApplicationFactory<Program> lambdaApplication;
    public FakeEmailService Email { get; } = new();

    public ApiApplicationFixture()
    {
        application = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Acceptance");
            builder.UseSetting("S3BucketName", "acceptance-tests");
            builder.UseSetting("RespondentBaseUrl", "http://localhost");
            builder.UseSetting("SesSender", "acceptance-tests@example.test");
            builder.UseSetting("RespondentIdentityKey", Convert.ToBase64String(new byte[32]));
            builder.UseSetting("TokenSigningKey", Convert.ToBase64String(new byte[32]));
            builder.UseSetting("AllowedWaveIds", "pulse-2026");
            builder.UseSetting("MaximumResponseBytes", "1048576");
            builder.UseSetting("Cors:AllowedOrigins:0", "http://localhost:5173");

            builder.ConfigureTestServices(services =>
            {
                // Test-only services belong here. They replace production registrations
                // through DI without changing the application entry point.
                services.AddSingleton<IResponseRepository, InMemoryResponseRepository>();
                services.AddSingleton<IEmailService>(Email);
            });
        });

        Client = application.CreateClient();

        lambdaApplication = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Acceptance");
            builder.UseSetting("AWS_LAMBDA_FUNCTION_NAME", "acceptance-api");
            builder.UseSetting("S3BucketName", "acceptance-tests");
            builder.UseSetting("RespondentBaseUrl", "http://localhost");
            builder.UseSetting("SesSender", "acceptance-tests@example.test");
            builder.UseSetting("RespondentIdentityKey", Convert.ToBase64String(new byte[32]));
            builder.UseSetting("TokenSigningKey", Convert.ToBase64String(new byte[32]));
            builder.UseSetting("AllowedWaveIds", "pulse-2026");
            builder.UseSetting("MaximumResponseBytes", "1048576");
            builder.UseSetting("Cors:AllowedOrigins:0", "http://localhost:5173");
        });

        LambdaClient = lambdaApplication.CreateClient();
    }

    public HttpClient Client { get; }
    public HttpClient LambdaClient { get; }

    public void Dispose()
    {
        Client.Dispose();
        LambdaClient.Dispose();
        application.Dispose();
        lambdaApplication.Dispose();
    }

    private sealed class InMemoryResponseRepository : IResponseRepository
    {
        public Task<SavedResponse> SaveAsync(StoredResponse response, CancellationToken cancellationToken)
        {
            return Task.FromResult(new SavedResponse(response.ResponseVersion, response.ReceivedAt));
        }

        public Task<StoredResponse?> GetLatestAsync(
            string surveyId,
            string waveId,
            string respondentId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult<StoredResponse?>(null);
        }
    }

}

public sealed record SentEmail(string Email, string SurveyId, string SurveyTitle, string AccessUrl);

public sealed class FakeEmailService : IEmailService
{
    public ConcurrentQueue<SentEmail> SentEmails { get; } = new();

    public Task SendAccessLinkAsync(
        string email,
        string surveyId,
        string surveyTitle,
        string accessUrl,
        CancellationToken cancellationToken)
    {
        SentEmails.Enqueue(new SentEmail(email, surveyId, surveyTitle, accessUrl));
        return Task.CompletedTask;
    }
}
