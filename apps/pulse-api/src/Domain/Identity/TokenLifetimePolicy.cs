namespace Domain.Identity;

public sealed class TokenLifetimePolicy : ITokenLifetimePolicy
{
    private readonly long _lifetimeSeconds;

    public TokenLifetimePolicy(TimeSpan lifetime)
    {
        if (lifetime <= TimeSpan.Zero || lifetime.Ticks % TimeSpan.TicksPerSecond != 0)
        {
            throw new ArgumentOutOfRangeException(nameof(lifetime), "The token lifetime must be a positive whole number of seconds.");
        }

        _lifetimeSeconds = lifetime.Ticks / TimeSpan.TicksPerSecond;
    }

    public long GetExpiry(long issuedAt)
    {
        return checked(issuedAt + _lifetimeSeconds);
    }
}
