using Domain.Configuration;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace MicroTests;

public sealed class PulseSettingsTests
{
    [Fact]
    public void Cors_origins_default_to_the_published_survey_origin()
    {
        var settings = new PulseSettings
        {
            S3BucketName = "responses",
            RespondentBaseUrl = "https://survey.labourtransparency.com",
            SesSender = "sender@example.com",
            RespondentIdentityKey = new byte[32],
            TokenSigningKey = new byte[32],
        };

        settings.AllowedCorsOrigins.Should().ContainSingle()
            .Which.Should().Be("https://survey.labourtransparency.com");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" , ")]
    public void Wave_ids_default_when_configuration_is_missing_or_blank(string? configuredIds)
    {
        var configuration = RequiredConfiguration();
        configuration["AllowedWaveIds"] = configuredIds;

        var settings = PulseSettings.FromEnvironment(configuration);

        settings.AllowedWaveIds.Should().ContainSingle()
            .Which.Should().Be("pulse-2026");
    }

    [Fact]
    public void Default_wave_is_a_profile_and_does_not_yet_interpret_its_version_rule()
    {
        var settings = new PulseSettings
        {
            S3BucketName = "responses",
            RespondentBaseUrl = "https://survey.labourtransparency.com",
            SesSender = "sender@example.com",
            RespondentIdentityKey = new byte[32],
            TokenSigningKey = new byte[32],
        };

        var wave = settings.Waves.Should().ContainSingle().Which;
        wave.WaveId.Should().Be("pulse-2026");
        wave.SurveyId.Should().Be("ltp.supply-chain-confidence");
        wave.SurveyVersion.Should().Be("1.0.2");
        wave.ValidSurveyVersions.Should().Be("*");
        settings.IsAllowedWave(wave.WaveId, wave.SurveyId, "future-version").Should().BeTrue();
    }

    [Fact]
    public void Email_provider_defaults_to_aws()
    {
        PulseSettings.FromEnvironment(RequiredConfiguration()).EmailProvider
            .Should().Be(PulseSettings.AwsEmailProvider);
    }

    [Fact]
    public void S3_server_side_encryption_defaults_to_enabled()
    {
        PulseSettings.FromEnvironment(RequiredConfiguration()).UseS3ServerSideEncryption
            .Should().BeTrue();
    }

    [Fact]
    public void S3_server_side_encryption_can_be_disabled_for_compatible_local_storage()
    {
        var configuration = RequiredConfiguration();
        configuration["UseS3ServerSideEncryption"] = "false";

        PulseSettings.FromEnvironment(configuration).UseS3ServerSideEncryption
            .Should().BeFalse();
    }

    [Fact]
    public void S3_server_side_encryption_defaults_to_disabled_for_local_endpoints()
    {
        var configuration = RequiredConfiguration();
        configuration["AWSServiceUrl"] = "http://localhost:19000";

        PulseSettings.FromEnvironment(configuration).UseS3ServerSideEncryption
            .Should().BeFalse();
    }

    [Fact]
    public void Ses_configuration_set_is_optional_and_read_from_environment()
    {
        var configuration = RequiredConfiguration();
        configuration["SesConfigurationSetName"] = "labour-transparency";

        PulseSettings.FromEnvironment(configuration).SesConfigurationSetName
            .Should().Be("labour-transparency");
    }

    [Fact]
    public void Email_provider_accepts_local_case_insensitively()
    {
        var configuration = RequiredConfiguration();
        configuration["EmailProvider"] = "local";

        PulseSettings.FromEnvironment(configuration).EmailProvider
            .Should().Be(PulseSettings.LocalEmailProvider);
    }

    [Fact]
    public void Email_provider_rejects_unknown_values()
    {
        var configuration = RequiredConfiguration();
        configuration["EmailProvider"] = "smtp";

        FluentActions.Invoking(() => PulseSettings.FromEnvironment(configuration))
            .Should().Throw<InvalidOperationException>()
            .WithMessage("*EmailProvider*");
    }

    private static ConfigurationManager RequiredConfiguration()
    {
        var configuration = new ConfigurationManager();
        configuration["S3BucketName"] = "responses";
        configuration["RespondentBaseUrl"] = "https://survey.labourtransparency.com";
        configuration["SesSender"] = "sender@example.com";
        configuration["RespondentIdentityKey"] = Convert.ToBase64String(new byte[32]);
        configuration["TokenSigningKey"] = Convert.ToBase64String(new byte[32]);
        return configuration;
    }
}
