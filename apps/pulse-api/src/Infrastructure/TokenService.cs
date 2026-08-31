using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Domain.Identity;

namespace Infrastructure;

public sealed class TokenService(byte[] signingKey) : ITokenService
{
    private readonly byte[] _signingKey = signingKey is { Length: >= 32 }
        ? signingKey.ToArray()
        : throw new ArgumentException("The token signing key must be at least 256 bits.", nameof(signingKey));

    public string Create(TokenClaims claims)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(claims.WaveId);
        ArgumentException.ThrowIfNullOrWhiteSpace(claims.RespondentId);
        var payload = JsonSerializer.SerializeToUtf8Bytes(new { w = claims.WaveId, r = claims.RespondentId });
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
            var root = document.RootElement;
            var wave = root.GetProperty("w").GetString();
            var respondent = root.GetProperty("r").GetString();
            if (string.IsNullOrWhiteSpace(wave) || string.IsNullOrWhiteSpace(respondent))
            {
                return false;
            }

            claims = new TokenClaims(wave, respondent);
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
