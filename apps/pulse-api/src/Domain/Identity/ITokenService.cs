namespace Domain.Identity;

public interface ITokenService
{
    string Create(TokenClaims claims);
    bool TryValidate(string token, out TokenClaims? claims);
}