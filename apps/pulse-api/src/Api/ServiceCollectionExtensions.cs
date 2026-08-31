using System.Text.Json;
using Microsoft.AspNetCore.Http.Json;

namespace Api;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddPulseJson()
        {
            services.Configure<JsonOptions>(options =>
                options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);
            return services;
        }
    }
}