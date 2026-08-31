using Domain.Configuration;

namespace IntegrationTests.Infrastructure;

public sealed class ConstructorInjectionTests(PulseSettings settings)
{
    [Fact]
    public void Application_settings_are_constructor_injected()
    {
        Assert.Equal("pulse-integration-tests", settings.S3BucketName);
    }
}