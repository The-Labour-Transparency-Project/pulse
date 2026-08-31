using System.Security.Cryptography;
using System.Text;
using Domain.Identity;

namespace Infrastructure;

public sealed class RespondentIdentityService(byte[] identityKey) : IRespondentIdentityService
{
    private readonly byte[] _identityKey = ValidateKey(identityKey);

    public string GetRespondentId(string surveyId, string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(surveyId);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        var input = $"{surveyId}:{IRespondentIdentityService.NormalizeEmail(email)}";
        // Keep the full keyed identity as the source, then publish only a
        // deterministic 64-bit checksum in the bearer credential. The keyed
        // source remains secret and the compact value is still opaque to the
        // respondent; 16 hex characters give 2^64 possible identities.
        var fullIdentity = Convert.ToHexString(
            HMACSHA256.HashData(_identityKey, Encoding.UTF8.GetBytes(input)));
        return Convert.ToHexString(SHA256.HashData(Encoding.ASCII.GetBytes(fullIdentity)))[..16]
            .ToLowerInvariant();
    }

    private static byte[] ValidateKey(byte[] key)
    {
        return key is { Length: >= 32 }
            ? key.ToArray()
            : throw new ArgumentException("The respondent identity key must be at least 256 bits.", nameof(key));
    }
}
