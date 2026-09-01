using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;

namespace Infrastructure;

public sealed class SesEmailService(IAmazonSimpleEmailService ses, string sender, string? configurationSetName) : IEmailService
{
    public Task SendAccessLinkAsync(
        string email,
        string surveyId,
        string surveyTitle,
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
                    Subject = new Content("Your Labour Transparency Pulse survey link"),
                    Body = new Body
                    {
                        Text = new Content(
                            $"Hello,\n\n" +
                            $"You requested access to the {surveyTitle} survey.\n\n" +
                            $"Use the secure link below to open it:\n\n{accessUrl}\n\n" +
                            "You can return to this email whenever you need to access your survey in the next 7 days.\n\n" +
                            "If you did not request this email, you can safely ignore it.\n\n" +
                            "Please do not reply to this automated message.\n\n" +
                            "Thank you,\n" +
                            "The Labour Transparency Project team"),
                    },
                },
            },
            cancellationToken);
    }
}
