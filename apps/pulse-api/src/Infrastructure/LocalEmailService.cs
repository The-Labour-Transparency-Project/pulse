using Microsoft.Extensions.Logging;

namespace Infrastructure;

public sealed class LocalEmailService(ILogger<LocalEmailService> logger) : IEmailService
{
    public Task SendAccessLinkAsync(
        string email,
        string surveyId,
        string accessUrl,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Local email for {Email}, survey {SurveyId}: access URL {AccessUrl}",
            email,
            surveyId,
            accessUrl);

        return Task.CompletedTask;
    }
}
