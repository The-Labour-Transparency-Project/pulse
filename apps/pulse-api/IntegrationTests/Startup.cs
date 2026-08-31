using IntegrationTests.Ioc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace IntegrationTests;

public sealed class Startup
{
    public void ConfigureServices(IServiceCollection services, HostBuilderContext context)
    {
        services.ConfigureIntegrationServices(context);
    }
}