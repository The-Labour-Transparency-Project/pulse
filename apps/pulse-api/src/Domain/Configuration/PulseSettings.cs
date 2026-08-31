using Microsoft.Extensions.Configuration;

namespace Domain.Configuration;

public sealed class PulseSettings
{
    public const string LocalEmailProvider = "Local";
    public const string AwsEmailProvider = "Aws";

    private const string DefaultWaveId = "pulse-2026";
    private const string DefaultSurveyId = "ltp.supply-chain-confidence";
    private const string DefaultSurveyVersion = "1.0.2";
    private static readonly string[] DefaultCorsOrigins = ["https://survey.labourtransparency.com"];
    private static readonly string[] DefaultAllowedWaveIds = [DefaultWaveId];

    private static readonly WaveDefinition DefaultWaveDefinition = new(
        DefaultWaveId,
        DefaultSurveyId,
        DefaultSurveyVersion,
        "*",
        new DateTimeOffset(2026, 8, 28, 0, 0, 0, TimeSpan.Zero),
        new DateTimeOffset(2026, 11, 28, 0, 0, 0, TimeSpan.Zero));

    public required string S3BucketName { get; init; }
    public required string RespondentBaseUrl { get; init; }
    public required string SesSender { get; init; }
    public string? SesConfigurationSetName { get; init; }
    public string EmailProvider { get; init; } = AwsEmailProvider;
    public bool UseS3ServerSideEncryption { get; init; } = true;
    public required byte[] RespondentIdentityKey { get; init; }
    public required byte[] TokenSigningKey { get; init; }
    public int MaximumResponseBytes { get; init; } = 1_048_576;
    public string[] AllowedWaveIds { get; init; } = DefaultAllowedWaveIds;
    public string[] AllowedCorsOrigins { get; init; } = DefaultCorsOrigins;
    public IReadOnlyList<WaveDefinition> Waves { get; init; } = [DefaultWaveDefinition];

    public bool IsAllowedWave(string waveId, string surveyId, string surveyVersion)
    {
        // ValidSurveyVersions is deliberately not interpreted yet. The wave
        // profile carries the future SemVer rule without enforcing it.
        return AllowedWaveIds.Contains(waveId, StringComparer.Ordinal) &&
               Waves.Any(wave => wave.WaveId == waveId && wave.SurveyId == surveyId);
    }

    public bool TryGetAllowedWave(string waveId, out WaveDefinition? wave)
    {
        wave = Waves.FirstOrDefault(candidate => candidate.WaveId == waveId);
        return wave is not null && AllowedWaveIds.Contains(waveId, StringComparer.Ordinal);
    }

    public bool IsWaveOpen(string waveId, DateTimeOffset now)
    {
        return Waves.Any(wave => wave.WaveId == waveId && now >= wave.OpensAt && now < wave.ClosesAt);
    }

    public static PulseSettings FromEnvironment(IConfiguration configuration)
    {
        return new PulseSettings
        {
            S3BucketName = Required(configuration, "S3BucketName"),
            RespondentBaseUrl = Required(configuration, "RespondentBaseUrl"),
            SesSender = Required(configuration, "SesSender"),
            SesConfigurationSetName = configuration["SesConfigurationSetName"],
            EmailProvider = ReadEmailProvider(configuration),
            // S3-compatible local endpoints such as MinIO do not provide the
            // KMS required by the AES256 SSE-S3 request header. AWS S3 keeps
            // encryption enabled unless explicitly overridden.
            UseS3ServerSideEncryption = ReadBoolean(
                configuration,
                "UseS3ServerSideEncryption",
                string.IsNullOrWhiteSpace(configuration["AWSServiceUrl"])),
            RespondentIdentityKey = ReadKey(configuration, "RespondentIdentityKey"),
            TokenSigningKey = ReadKey(configuration, "TokenSigningKey"),
            MaximumResponseBytes = int.TryParse(configuration["MaximumResponseBytes"], out var limit) && limit > 0
                ? limit
                : 1_048_576,
            AllowedWaveIds = ReadAllowedWaveIds(configuration),
            AllowedCorsOrigins = ReadCorsOrigins(configuration),
            Waves = [ReadDefaultWave(configuration)],
        };
    }

    private static WaveDefinition ReadDefaultWave(IConfiguration configuration)
    {
        return new WaveDefinition(
            configuration["DefaultWaveId"] ?? DefaultWaveDefinition.WaveId,
            configuration["DefaultWaveSurveyId"] ?? DefaultWaveDefinition.SurveyId,
            configuration["DefaultWaveSurveyVersion"] ?? DefaultWaveDefinition.SurveyVersion,
            configuration["DefaultWaveValidSurveyVersions"] ?? DefaultWaveDefinition.ValidSurveyVersions,
            ReadDate(configuration, "WaveOpensAt", DefaultWaveDefinition.OpensAt),
            ReadDate(configuration, "WaveClosesAt", DefaultWaveDefinition.ClosesAt));
    }

    private static DateTimeOffset ReadDate(IConfiguration configuration, string name, DateTimeOffset fallback)
    {
        return DateTimeOffset.TryParse(configuration[name], out var value) ? value : fallback;
    }

    private static string[] ReadCorsOrigins(IConfiguration configuration)
    {
        var configuredOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .GetChildren()
            .Select(setting => setting.Value)
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Cast<string>()
            .ToArray();

        return configuredOrigins.Length > 0 ? configuredOrigins : DefaultCorsOrigins;
    }

    private static string[] ReadAllowedWaveIds(IConfiguration configuration)
    {
        var configuredWaveIds = configuration["AllowedWaveIds"]?
                                    .Split(
                                        ',',
                                        StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                ?? [];

        return configuredWaveIds.Length > 0 ? configuredWaveIds : DefaultAllowedWaveIds;
    }

    private static string ReadEmailProvider(IConfiguration configuration)
    {
        var provider = configuration["EmailProvider"];
        if (string.IsNullOrWhiteSpace(provider))
        {
            return AwsEmailProvider;
        }

        if (provider.Equals(LocalEmailProvider, StringComparison.OrdinalIgnoreCase))
        {
            return LocalEmailProvider;
        }

        if (provider.Equals(AwsEmailProvider, StringComparison.OrdinalIgnoreCase))
        {
            return AwsEmailProvider;
        }

        throw new InvalidOperationException(
            $"EmailProvider must be '{LocalEmailProvider}' or '{AwsEmailProvider}'.");
    }

    private static bool ReadBoolean(IConfiguration configuration, string name, bool fallback)
    {
        return bool.TryParse(configuration[name], out var value) ? value : fallback;
    }

    private static byte[] ReadKey(IConfiguration configuration, string name)
    {
        try
        {
            var key = Convert.FromBase64String(Required(configuration, name));
            if (key.Length < 32)
            {
                throw new InvalidOperationException($"{name} must contain at least 256 bits.");
            }

            return key;
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException($"{name} must be base64 encoded.", exception);
        }
    }

    private static string Required(IConfiguration configuration, string name)
    {
        return configuration[name] ?? throw new InvalidOperationException($"Missing environment configuration: {name}");
    }
}
