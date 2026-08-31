namespace Domain.Identity;

public interface ITokenLifetimePolicy
{
    long GetExpiry(long issuedAt);
}
