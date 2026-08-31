using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Domain.Identity;

namespace Infrastructure;

public sealed class TokenService(
    byte[] signingKey,
    ITokenLifetimePolicy lifetimePolicy,
    TimeProvider timeProvider) : ITokenService
{
    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
    private readonly ITokenLifetimePolicy _lifetimePolicy = lifetimePolicy ?? throw new ArgumentNullException(nameof(lifetimePolicy));
    private readonly byte[] _signingKey = signingKey is { Length: >= 32 }
        ? signingKey.ToArray()
        : throw new ArgumentException("The token signing key must be at least 256 bits.", nameof(signingKey));

    public string Create(TokenClaims claims)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(claims.WaveId);
        ArgumentException.ThrowIfNullOrWhiteSpace(claims.RespondentId);
        var issuedAt = claims.IssuedAt == 0 ? _timeProvider.GetUtcNow().ToUnixTimeSeconds() : claims.IssuedAt;
        var expiresAt = claims.ExpiresAt == 0 ? _lifetimePolicy.GetExpiry(issuedAt) : claims.ExpiresAt;
        if (expiresAt <= issuedAt)
        {
            throw new ArgumentException("The token expiry must be after its issue time.", nameof(claims));
        }

        var payload = JsonSerializer.SerializeToUtf8Bytes(new object[] { claims.WaveId, claims.RespondentId, issuedAt, expiresAt });
        var encodedPayload = Base64Url(payload);
        return
            $"{encodedPayload}.{Base64Url(HMACSHA256.HashData(_signingKey, Encoding.ASCII.GetBytes(encodedPayload)))}";
    }

    public bool TryValidate(string token, out TokenClaims? claims)
    {
        claims = null;
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        var parts = token.Split('.');
        if (parts.Length != 2 || !TryDecode(parts[0], out var payload) ||
            !TryDecode(parts[1], out var signature))
        {
            return false;
        }

        var expected = HMACSHA256.HashData(_signingKey, Encoding.ASCII.GetBytes(parts[0]));
        if (!CryptographicOperations.FixedTimeEquals(signature, expected))
        {
            return false;
        }

        try
        {
            using var document = JsonDocument.Parse(payload);
            var values = document.RootElement;
            if (values.ValueKind != JsonValueKind.Array || values.GetArrayLength() != 4)
            {
                return false;
            }

            var wave = values[0].GetString();
            var respondent = values[1].GetString();
            if (string.IsNullOrWhiteSpace(wave) || string.IsNullOrWhiteSpace(respondent) ||
                !values[2].TryGetInt64(out var issuedAt) || !values[3].TryGetInt64(out var expiresAt) ||
                expiresAt <= issuedAt || _timeProvider.GetUtcNow().ToUnixTimeSeconds() >= expiresAt)
            {
                return false;
            }

            claims = new TokenClaims(wave, respondent, issuedAt, expiresAt);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
        catch (KeyNotFoundException)
        {
            return false;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }

    private static string Base64Url(ReadOnlySpan<byte> bytes)
    {
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    private static bool TryDecode(string value, out byte[] bytes)
    {
        bytes = [];
        try
        {
            bytes = Convert.FromBase64String(
                value.Replace("-", "+").Replace("_", "/") + new string('=', (4 - value.Length % 4) % 4));
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
