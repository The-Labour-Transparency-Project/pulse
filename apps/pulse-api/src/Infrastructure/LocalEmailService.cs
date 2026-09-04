using Microsoft.Extensions.Logging;

namespace Infrastructure;

public sealed class LocalEmailService(ILogger<LocalEmailService> logger) : IEmailService
{
    public Task SendAccessLinkAsync(
        string email,
        string surveyId,
        string surveyTitle,
        string accessUrl,
        string accessToken,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Local email for {Email}, survey {SurveyId} ({SurveyTitle}): access URL {AccessUrl}, access token {AccessToken}",
            email,
            surveyId,
            surveyTitle,
            accessUrl,
            accessToken);

        return Task.CompletedTask;
    }
}
