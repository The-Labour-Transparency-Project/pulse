using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Ioc;

public static class IocModelFactoriesRegistrationExtensions
{
    public static IServiceCollection RegisterModelFactories(this IServiceCollection services)
    {
        // Add reusable persisted factories here as database-backed entities are introduced.
        return services;
    }
}