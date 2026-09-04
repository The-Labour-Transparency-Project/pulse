using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace AcceptanceTests;

public sealed class ApiEndpointTests(ApiApplicationFixture application) : IClassFixture<ApiApplicationFixture>
{
    [Fact]
    public async Task Ping_returns_ok()
    {
        var response = await application.Client.GetAsync("/ping");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Be("{\"status\":\"ok\"}");
    }

    [Fact]
    public async Task Cors_preflight_allows_the_configured_respondent_origin()
    {
        using var request = new HttpRequestMessage(HttpMethod.Options, "/ping");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await application.Client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.Headers.GetValues("Access-Control-Allow-Origin")
            .Should().ContainSingle().Which.Should().Be("http://localhost:5173");
    }

    [Fact]
    public async Task Direct_hosting_emits_exactly_one_cors_origin_header()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/ping");
        request.Headers.Add("Origin", "http://localhost:5173");

        var response = await application.Client.SendAsync(request);

        response.Headers.GetValues("Access-Control-Allow-Origin")
            .Should().ContainSingle().Which.Should().Be("http://localhost:5173");
    }

    [Fact]
    public async Task Lambda_hosting_does_not_emit_application_cors_headers()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/ping");
        request.Headers.Add("Origin", "https://survey.labourtransparency.com");

        var response = await application.LambdaClient.SendAsync(request);

        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeFalse();
    }

    [Fact]
    public async Task Token_request_sends_an_access_link_containing_a_valid_token()
    {
        var sentEmailCount = application.Email.SentEmails.Count;
        var response = await application.Client.PostAsJsonAsync("/token", new
        {
            waveId = "pulse-2026",
            surveyId = "ltp.supply-chain-confidence",
            surveyVersion = "1.0.2",
            email = "researcher@example.com",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var email = application.Email.SentEmails.Skip(sentEmailCount).Should().ContainSingle().Which;
        email.Email.Should().Be("researcher@example.com");
        email.SurveyId.Should().Be("ltp.supply-chain-confidence");
        email.SurveyTitle.Should().Be("Confidence in Labour Supply Chains 2026");

        var accessLink = new Uri(email.AccessUrl);
        accessLink.Query.Should().StartWith("?t=");

        var token = Uri.UnescapeDataString(accessLink.Query[3..]);
        token.Split('.').Should().HaveCount(2);
        email.AccessToken.Should().Be(token);

        using var authenticatedRequest = new HttpRequestMessage(HttpMethod.Get, "/response/latest");
        authenticatedRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var authenticatedResponse = await application.Client.SendAsync(authenticatedRequest);

        authenticatedResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Latest_response_accepts_a_signed_token_in_the_authorization_bearer_header()
    {
        var sentEmailCount = application.Email.SentEmails.Count;
        await application.Client.PostAsJsonAsync("/token", new
        {
            waveId = "pulse-2026",
            surveyId = "ltp.supply-chain-confidence",
            surveyVersion = "1.0.2",
            email = "signed-token@example.com",
        });

        var accessLink = new Uri(application.Email.SentEmails.Skip(sentEmailCount).Should().ContainSingle().Which.AccessUrl);
        var signedToken = Uri.UnescapeDataString(accessLink.Query[3..]);

        using var signedRequest = new HttpRequestMessage(HttpMethod.Get, "/response/latest");
        signedRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", signedToken);

        var signedResponse = await application.Client.SendAsync(signedRequest);

        signedResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Token_request_refreshes_an_unexpired_token_when_email_matches()
    {
        var sentEmailCount = application.Email.SentEmails.Count;
        await application.Client.PostAsJsonAsync("/token", new
        {
            waveId = "pulse-2026",
            surveyId = "ltp.supply-chain-confidence",
            surveyVersion = "1.0.2",
            email = "refresh@example.com",
        });
        var accessLink = new Uri(application.Email.SentEmails.Skip(sentEmailCount).Single().AccessUrl);
        var token = Uri.UnescapeDataString(accessLink.Query[3..]);

        var response = await application.Client.PostAsJsonAsync("/token", new { token, email = "refresh@example.com" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var refreshed = await response.Content.ReadFromJsonAsync<JsonElement>();
        refreshed.GetProperty("token").GetString().Should().NotBeNullOrWhiteSpace();
        refreshed.GetProperty("iat").GetInt64().Should().BeGreaterThan(0);
        refreshed.GetProperty("exp").GetInt64().Should().BeGreaterThan(refreshed.GetProperty("iat").GetInt64());
    }

    [Fact]
    public async Task Token_request_rejects_refresh_with_a_different_email()
    {
        var sentEmailCount = application.Email.SentEmails.Count;
        await application.Client.PostAsJsonAsync("/token", new
        {
            waveId = "pulse-2026",
            surveyId = "ltp.supply-chain-confidence",
            surveyVersion = "1.0.2",
            email = "refresh-bound@example.com",
        });
        var accessLink = new Uri(application.Email.SentEmails.Skip(sentEmailCount).Single().AccessUrl);
        var token = Uri.UnescapeDataString(accessLink.Query[3..]);

        var response = await application.Client.PostAsJsonAsync("/token", new { token, email = "other@example.com" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("Basic", "credentials")]
    [InlineData("Bearer", "unsigned-token")]
    [InlineData("Bearer", "not.a.valid.signature")]
    public async Task Latest_response_rejects_requests_without_a_signed_bearer_token(
        string? scheme,
        string? parameter)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/response/latest");
        if (scheme is not null)
        {
            request.Headers.Authorization = parameter is null
                ? new AuthenticationHeaderValue(scheme)
                : new AuthenticationHeaderValue(scheme, parameter);
        }

        var response = await application.Client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("POST", "/ping", HttpStatusCode.MethodNotAllowed)]
    [InlineData("PUT", "/ping", HttpStatusCode.MethodNotAllowed)]
    [InlineData("DELETE", "/ping", HttpStatusCode.MethodNotAllowed)]
    [InlineData("GET", "/token", HttpStatusCode.MethodNotAllowed)]
    [InlineData("PUT", "/token", HttpStatusCode.MethodNotAllowed)]
    [InlineData("GET", "/response", HttpStatusCode.MethodNotAllowed)]
    [InlineData("POST", "/response", HttpStatusCode.MethodNotAllowed)]
    [InlineData("GET", "/response/latest", HttpStatusCode.Unauthorized)]
    [InlineData("POST", "/response/latest", HttpStatusCode.MethodNotAllowed)]
    public async Task Endpoints_reject_unsupported_or_unauthenticated_requests(
        string method,
        string path,
        HttpStatusCode expectedStatusCode)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);

        var response = await application.Client.SendAsync(request);

        response.StatusCode.Should().Be(expectedStatusCode);
    }
}
