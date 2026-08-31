using Amazon.S3;
using Amazon.SimpleEmail;
using Domain;
using Domain.Configuration;
using Domain.Identity;
using Domain.Responses;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddPulseServices(PulseSettings settings)
        {
            services.AddSingleton(settings);
            services.AddSingleton<IRespondentIdentityService>(_ =>
                new RespondentIdentityService(settings.RespondentIdentityKey));
            services.AddSingleton<ITokenService>(_ => new TokenService(settings.TokenSigningKey));
            services.AddSingleton(new ResponseDocumentValidator(settings.MaximumResponseBytes));
            services.AddSingleton<IResponseRepository>(provider =>
                new S3ResponseRepository(
                    provider.GetRequiredService<IAmazonS3>(),
                    settings.S3BucketName,
                    useServerSideEncryption: settings.UseS3ServerSideEncryption));
            services.AddSingleton<IEmailService>(provider => settings.EmailProvider == PulseSettings.LocalEmailProvider
                ? new LocalEmailService(provider.GetRequiredService<ILogger<LocalEmailService>>())
                : new SesEmailService(
                    provider.GetRequiredService<IAmazonSimpleEmailService>(),
                    settings.SesSender,
                    settings.SesConfigurationSetName));
            services.AddSingleton<IS3Provisioner, S3Provisioner>();
            return services;
        }
    }
}
