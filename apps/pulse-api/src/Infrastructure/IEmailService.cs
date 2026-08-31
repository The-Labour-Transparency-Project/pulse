namespace Infrastructure;

public interface IEmailService
{
    Task SendAccessLinkAsync(string email, string surveyId, string accessUrl, CancellationToken cancellationToken);
}