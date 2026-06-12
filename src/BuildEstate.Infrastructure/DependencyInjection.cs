using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Interfaces;
using BuildEstate.Application.Settings;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Services;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Persistence.Interceptors;
using BuildEstate.Infrastructure.Persistence.Services;
using BuildEstate.Infrastructure.Services;
using BuildEstate.Infrastructure.Services.BackgroundServices;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BuildEstate.Infrastructure;

/// <summary>
/// Extension methods for registering Infrastructure layer services
/// including DbContext, Identity, repositories, and token services.
/// </summary>
public static class InfrastructureDependencyInjection
{
    /// <summary>
    /// Registers all Infrastructure layer services into the DI container.
    /// </summary>
    /// <param name="services">The service collection to register services into.</param>
    /// <param name="configuration">The application configuration for reading connection strings and settings.</param>
    /// <returns>The service collection for method chaining.</returns>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Read and validate connection string
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is missing, empty, or whitespace in application configuration.");
        }

        // 2. Bind configuration settings
        services.Configure<PlanningFeeSettings>(
            configuration.GetSection(PlanningFeeSettings.SectionName));

        // 3. Register AuditInterceptor as scoped
        services.AddScoped<AuditInterceptor>();

        // 3. Register BuildEstateDbContext with SQL Server provider
        services.AddDbContext<BuildEstateDbContext>((serviceProvider, options) =>
        {
            var auditInterceptor = serviceProvider.GetRequiredService<AuditInterceptor>();

            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly("BuildEstate.Infrastructure");
            });

            options.AddInterceptors(auditInterceptor);
        });

        // 4. Register ASP.NET Identity with ApplicationUser and ApplicationRole
        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            // Password policy
            options.Password.RequiredLength = 8;
            options.Password.RequireUppercase = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireDigit = true;
            options.Password.RequireNonAlphanumeric = true;

            // Lockout policy
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        })
        .AddEntityFrameworkStores<BuildEstateDbContext>()
        .AddDefaultTokenProviders();

        // 5. Register IRepository<> → Repository<> with scoped lifetime (open generic)
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        // 6. Register IUnitOfWork → UnitOfWork with scoped lifetime
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // 7. Register ITokenService → TokenService with scoped lifetime
        services.AddScoped<ITokenService, TokenService>();

        // 8. Register Land Acquisition state machines (stateless — Singleton)
        services.AddSingleton<IOpportunityStateMachine, OpportunityStateMachine>();
        services.AddSingleton<IOfferStateMachine, OfferStateMachine>();
        services.AddSingleton<IDueDiligenceStateMachine, DueDiligenceStateMachine>();
        services.AddSingleton<IContractStateMachine, ContractStateMachine>();

        // 9. Register Planning & Approvals state machines (stateless — Singleton)
        services.AddSingleton<IPlanningStatusStateMachine, PlanningStatusStateMachine>();
        services.AddSingleton<IConditionStatusStateMachine, ConditionStatusStateMachine>();
        services.AddSingleton<IAppealStatusStateMachine, AppealStatusStateMachine>();
        services.AddSingleton<IFeeStatusStateMachine, FeeStatusStateMachine>();

        // 10. Register file storage service (Singleton — uses IConfiguration)
        services.AddSingleton<IFileStorageService, FileStorageService>();

        // 11. Register notification service (Scoped — uses DbContext)
        services.AddScoped<INotificationService, NotificationService>();

        // 12. Register audit log query service (Scoped — uses DbContext)
        services.AddScoped<IAuditLogQueryService, AuditLogQueryService>();

        // 13. Register background services
        services.AddHostedService<OfferExpiryBackgroundService>();

        return services;
    }
}
