using System.Reflection;
using BuildEstate.Application.Behaviors;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace BuildEstate.Application;

/// <summary>
/// Provides extension methods for registering Application layer services in the DI container.
/// </summary>
public static class ApplicationDependencyInjection
{
    /// <summary>
    /// Registers MediatR, FluentValidation, AutoMapper, and pipeline behaviors
    /// for the Application layer.
    /// </summary>
    /// <param name="services">The service collection to add services to.</param>
    /// <returns>The service collection for method chaining.</returns>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Register MediatR with assembly scanning and pipeline behaviors
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        });

        // Register FluentValidation validators via assembly scanning
        services.AddValidatorsFromAssembly(assembly);

        // Register AutoMapper profiles via assembly scanning
        services.AddAutoMapper(cfg => cfg.AddMaps(assembly));

        return services;
    }
}
