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
        var service = new TokenService(Key("s"));
        var claims = new TokenClaims("pulse-2026", new string('a', 16));
        var token = service.Create(claims);
        service.TryValidate(token, out var parsed).Should().BeTrue();
        parsed.Should().Be(claims);
        var encodedPayload = token.Split('.')[0].Replace('-', '+').Replace('_', '/');
        var payload = JsonDocument.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(
            encodedPayload + new string('=', (4 - encodedPayload.Length % 4) % 4)))).RootElement;
        payload.EnumerateObject().Select(property => property.Name).Should().BeEquivalentTo("w", "r");
        payload.GetProperty("r").GetString().Should().HaveLength(16);
        service.TryValidate(token[..^1] + (token[^1] == 'A' ? 'B' : 'A'), out _)
            .Should().BeFalse();
        service.Create(claims).Should().Be(token);
    }

    [Theory]
    [InlineData("not-a-token")]
    [InlineData("e30.signature")]
    public void Malformed_and_missing_claim_tokens_are_rejected(string token)
    {
        var service = new TokenService(Key("s"));
        service.TryValidate(token, out _).Should().BeFalse();
    }
}
