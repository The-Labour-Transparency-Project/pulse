using Amazon.S3;
using Domain;
using Domain.Configuration;
using Infrastructure;
using IntegrationTests.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit.DependencyInjection;
using Xunit.DependencyInjection.Logging;

namespace IntegrationTests.Ioc;

public static class StartUpRegistrationExtensions
{
    public static IServiceCollection ConfigureIntegrationServices(
        this IServiceCollection services,
        HostBuilderContext context)
    {
        var settings = TestSettings.Create(context.Configuration);
        var awsOptions = context.Configuration.GetAWSOptions();
        if (!string.IsNullOrWhiteSpace(context.Configuration["AWSServiceUrl"]))
        {
            awsOptions.DefaultClientConfig.ServiceURL = context.Configuration["AWSServiceUrl"];
        }

        services.AddDefaultAWSOptions(awsOptions)
            .AddAWSService<IAmazonS3>()
            .AddPulseServices(settings)
            .AddLogging(logging => logging.AddXunitOutput());

        services.AddSingleton<IS3Provisioner, S3Provisioner>();
        services.AddScoped<BeforeAfterTest, ModelFactorySetupTeardown>();
        services.RegisterModelFactories();
        return services;
    }

    private static class TestSettings
    {
        public static PulseSettings Create(IConfiguration configuration)
        {
            return new PulseSettings
            {
                S3BucketName = configuration["S3BucketName"] ?? "pulse-integration-tests",
                RespondentBaseUrl = configuration["RespondentBaseUrl"] ?? "http://localhost",
                SesSender = configuration["SesSender"] ?? "integration-tests@example.test",
                RespondentIdentityKey = Key(configuration["RespondentIdentityKey"]),
                TokenSigningKey = Key(configuration["TokenSigningKey"]),
                MaximumResponseBytes = int.TryParse(configuration["MaximumResponseBytes"], out var limit) && limit > 0
                    ? limit
                    : 1_048_576,
                AllowedWaveIds =
                    (configuration["AllowedWaveIds"] ?? "pulse-2026").Split(',', StringSplitOptions.TrimEntries),
            };
        }

        private static byte[] Key(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? new byte[32]
                : Convert.FromBase64String(value);
        }
    }
}
