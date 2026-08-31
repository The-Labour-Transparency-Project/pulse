namespace Domain.Identity;

public interface IRespondentIdentityService
{
    string GetRespondentId(string surveyId, string email);

    static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}