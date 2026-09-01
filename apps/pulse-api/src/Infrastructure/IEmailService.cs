namespace Infrastructure;

public interface IEmailService
{
    Task SendAccessLinkAsync(
        string email,
        string surveyId,
        string surveyTitle,
        string accessUrl,
        CancellationToken cancellationToken);
}
