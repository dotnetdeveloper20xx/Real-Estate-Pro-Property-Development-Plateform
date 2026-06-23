using BuildEstate.Application.Features.Search.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Search;

/// <summary>
/// Startup validation service that verifies all registered ISearchProvider instances
/// resolve correctly from the DI container. Logs warnings for any providers that
/// fail to resolve, helping detect registration or dependency issues early.
/// </summary>
public class SearchProviderValidationService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SearchProviderValidationService> _logger;

    public SearchProviderValidationService(
        IServiceProvider serviceProvider,
        ILogger<SearchProviderValidationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        ValidateSearchProviders();
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private void ValidateSearchProviders()
    {
        using var scope = _serviceProvider.CreateScope();

        try
        {
            var providers = scope.ServiceProvider.GetServices<ISearchProvider>().ToList();

            if (providers.Count == 0)
            {
                _logger.LogWarning("No ISearchProvider implementations were resolved from the DI container");
                return;
            }

            _logger.LogInformation(
                "Successfully resolved {ProviderCount} search providers: {ProviderNames}",
                providers.Count,
                string.Join(", ", providers.Select(p => $"{p.EntityName} ({p.GetType().Name})")));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "One or more ISearchProvider implementations failed to resolve from the DI container. " +
                "Search functionality may be degraded");
        }
    }
}
