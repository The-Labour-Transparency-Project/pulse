using System.Security.Cryptography;

namespace Domain;

public static class Ulid
{
    private const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

    public static string NewUlid()
    {
        Span<byte> bytes = stackalloc byte[16];
        var milliseconds = (ulong)DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        for (var i = 5; i >= 0; i--)
        {
            bytes[i] = (byte)(milliseconds & 255);
            milliseconds >>= 8;
        }

        RandomNumberGenerator.Fill(bytes[6..]);
        Span<char> result = stackalloc char[26];
        for (var i = 0; i < 26; i++)
        {
            var bit = i * 5;
            var value = 0;
            for (var j = 0; j < 5; j++)
            {
                var sourceBit = bit + j - 2;
                value = (value << 1) |
                        (sourceBit >= 0 && ((bytes[sourceBit / 8] >> (7 - sourceBit % 8)) & 1) == 1 ? 1 : 0);
            }

            result[i] = Alphabet[value];
        }

        return new string(result);
    }
}