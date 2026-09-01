using Microsoft.Extensions.Logging;

namespace Infrastructure;

public sealed class LocalEmailService(ILogger<LocalEmailService> logger) : IEmailService
{
    public Task SendAccessLinkAsync(
        string email,
        string surveyId,
        string surveyTitle,
        string accessUrl,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Local email for {Email}, survey {SurveyId} ({SurveyTitle}): access URL {AccessUrl}",
            email,
            surveyId,
            surveyTitle,
            accessUrl);

        return Task.CompletedTask;
    }
}
