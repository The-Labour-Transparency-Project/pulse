using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;

namespace Infrastructure;

public sealed class SesEmailService(IAmazonSimpleEmailService ses, string sender, string? configurationSetName) : IEmailService
{
    public Task SendAccessLinkAsync(
        string email,
        string surveyId,
        string accessUrl,
        CancellationToken cancellationToken)
    {
        return ses.SendEmailAsync(
            new SendEmailRequest
            {
                Source = sender,
                ConfigurationSetName = configurationSetName,
                Destination = new Destination { ToAddresses = [email] },
                Message = new Message
                {
                    Subject = new Content("Your Labour Transparency Pulse access link"),
                    Body = new Body
                    {
                        Text = new Content(
                            $"Use this link to access your {surveyId} survey: {accessUrl}\n\nIf you did not request this, you can ignore this email."),
                    },
                },
            },
            cancellationToken);
    }
}
