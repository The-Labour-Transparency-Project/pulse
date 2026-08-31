using Domain.Identity;
using FluentAssertions;
using Infrastructure;
using System.Text;
using System.Text.Json;

namespace MicroTests;

public class IdentityTests
{
    private static byte[] Key(string value)
    {
        return Enumerable.Repeat((byte)value[0], 32).ToArray();
    }

    [Theory]
    [InlineData(" Person@Example.COM ", "person@example.com")]
    [InlineData("PERSON@EXAMPLE.COM", " person@example.com ")]
    public void Same_survey_and_email_are_deterministic_and_conservative(string firstEmail, string equivalentEmail)
    {
        var service = new RespondentIdentityService(Key("a"));
        var first = service.GetRespondentId("pulse-2026", firstEmail);

        first.Should().Be(service.GetRespondentId("pulse-2026", equivalentEmail));
        first.Should().HaveLength(16);
        first.Should().NotContain("person");
    }

    [Theory]
    [InlineData("pulse-2026", "pulse-2027", "person@example.com", "person@example.com")]
    [InlineData("pulse-2026", "pulse-2026", "person@example.com", "other@example.com")]
    public void Survey_and_email_are_both_identity_bound(
        string firstSurvey,
        string secondSurvey,
        string firstEmail,
        string secondEmail)
    {
        var service = new RespondentIdentityService(Key("a"));

        service.GetRespondentId(firstSurvey, firstEmail)
            .Should().NotBe(service.GetRespondentId(secondSurvey, secondEmail));
    }

    [Theory]
    [InlineData("a", "b")]
    [InlineData("a", "c")]
    public void Changing_identity_key_changes_identity(string firstKey, string secondKey)
    {
        var input = ("pulse-2026", "person@example.com");

        new RespondentIdentityService(Key(firstKey)).GetRespondentId(input.Item1, input.Item2)
            .Should().NotBe(new RespondentIdentityService(Key(secondKey))
                .GetRespondentId(input.Item1, input.Item2));
    }

    [Fact]
    public void Token_is_signed_and_regenerates_same_namespace()
    {
        var service = Service();
        var claims = new TokenClaims("pulse-2026", new string('a', 16), 2_000_000_000, 2_000_604_800);
        var token = service.Create(claims);
        service.TryValidate(token, out var parsed).Should().BeTrue();
        parsed.Should().Be(claims);
        var encodedPayload = token.Split('.')[0].Replace('-', '+').Replace('_', '/');
        var payload = JsonDocument.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(
            encodedPayload + new string('=', (4 - encodedPayload.Length % 4) % 4)))).RootElement;
        payload.ValueKind.Should().Be(JsonValueKind.Array);
        payload.GetArrayLength().Should().Be(4);
        payload[1].GetString().Should().HaveLength(16);
        var tokenParts = token.Split('.');
        var tamperedSignature = (tokenParts[1][0] == 'A' ? 'B' : 'A') + tokenParts[1][1..];
        service.TryValidate($"{tokenParts[0]}.{tamperedSignature}", out _)
            .Should().BeFalse();
        service.Create(claims).Should().Be(token);
    }

    [Fact]
    public void Expired_tokens_are_rejected()
    {
        var service = Service();
        var token = service.Create(new TokenClaims("pulse-2026", new string('a', 16), 1, 2));

        service.TryValidate(token, out _).Should().BeFalse();
    }

    [Theory]
    [InlineData("not-a-token")]
    [InlineData("e30.signature")]
    public void Malformed_and_missing_claim_tokens_are_rejected(string token)
    {
        var service = Service();
        service.TryValidate(token, out _).Should().BeFalse();
    }

    [Fact]
    public void Token_uses_the_configured_lifetime_when_expiry_is_omitted()
    {
        var now = DateTimeOffset.FromUnixTimeSeconds(2_000_000_000);
        var service = Service(TimeSpan.FromMinutes(15), now);

        service.TryValidate(service.Create(new TokenClaims("pulse-2026", new string('a', 16), 0, 0)), out var claims)
            .Should().BeTrue();
        claims!.IssuedAt.Should().Be(now.ToUnixTimeSeconds());
        claims.ExpiresAt.Should().Be(now.AddMinutes(15).ToUnixTimeSeconds());
    }

    [Theory]
    [InlineData(199, true)]
    [InlineData(200, false)]
    public void Token_expiry_is_exclusive_at_the_exact_boundary(long currentTime, bool expectedValid)
    {
        var service = Service(TimeSpan.FromMinutes(1), DateTimeOffset.FromUnixTimeSeconds(currentTime));
        var token = service.Create(new TokenClaims("pulse-2026", new string('a', 16), 100, 200));

        service.TryValidate(token, out _).Should().Be(expectedValid);
    }

    private static TokenService Service(
        TimeSpan? lifetime = null,
        DateTimeOffset? now = null)
    {
        return new TokenService(
            Key("s"),
            new TokenLifetimePolicy(lifetime ?? TimeSpan.FromDays(7)),
            new FixedTimeProvider(now ?? DateTimeOffset.FromUnixTimeSeconds(2_000_000_001)));
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
