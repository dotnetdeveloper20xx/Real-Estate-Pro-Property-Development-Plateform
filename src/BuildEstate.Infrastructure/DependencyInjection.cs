using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.LegalCompliance.AuditTrail;
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
using BuildEstate.Infrastructure.Services.LegalCompliance;
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
            options.Lockout.AllowedForNewUsers = true;
        })
        .AddEntityFrameworkStores<BuildEstateDbContext>()
        .AddDefaultTokenProviders();

        // 5. Register IRepository<> → Repository<> with scoped lifetime (open generic)
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        // 6. Register IUnitOfWork → UnitOfWork with scoped lifetime
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // 7. Register ITokenService → TokenService with scoped lifetime
        // Register for both Application-layer (ITokenService) and Infrastructure-layer (IInfrastructureTokenService) interfaces
        services.AddScoped<TokenService>();
        services.AddScoped<Application.Interfaces.ITokenService>(sp => sp.GetRequiredService<TokenService>());
        services.AddScoped<IInfrastructureTokenService>(sp => sp.GetRequiredService<TokenService>());

        // 7a. Register IAccountLockoutService → AccountLockoutService with scoped lifetime
        services.AddScoped<IAccountLockoutService, AccountLockoutService>();

        // 7a. Register IPasswordHistoryService → PasswordHistoryService with scoped lifetime
        services.AddScoped<IPasswordHistoryService, PasswordHistoryService>();

        // 7b. Register ISessionService → SessionService with scoped lifetime
        services.AddScoped<ISessionService, SessionService>();

        // 7c. Register IIdentityService → IdentityService with scoped lifetime
        services.AddScoped<IIdentityService, IdentityService>();

        // 7d. Register IUserIdentityService → UserIdentityService with scoped lifetime
        services.AddScoped<IUserIdentityService, UserIdentityService>();

        // 7e. Register IUserQueryService → UserQueryService with scoped lifetime
        services.AddScoped<IUserQueryService, UserQueryService>();

        // 7f. Register IRoleQueryService → RoleQueryService with scoped lifetime
        services.AddScoped<IRoleQueryService, RoleQueryService>();

        // 7g. Register IRoleManagementService → RoleManagementService with scoped lifetime
        services.AddScoped<IRoleManagementService, RoleManagementService>();

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

        // 11a. Register notification engine (Scoped — rule-based notification dispatch)
        services.AddScoped<INotificationEngine, NotificationEngine>();

        // 12. Register audit log query service (Scoped — uses DbContext)
        services.AddScoped<IAuditLogQueryService, AuditLogQueryService>();

        // 12b. Register audit log service for immutable audit entry creation and querying (Scoped — uses DbContext)
        services.AddScoped<IAuditLogService, AuditLogService>();

        // 12a. Register audit trail query service for Legal & Compliance (Scoped — uses DbContext)
        services.AddScoped<IAuditTrailQueryService, AuditTrailQueryService>();

        // 13. Register Legal & Compliance services (Scoped — uses DbContext)
        services.AddScoped<ILegalReferenceNumberGenerator, LegalReferenceNumberGenerator>();

        // 14. Register Legal & Compliance state machines (stateless — Singleton)
        services.AddSingleton<ILegalCaseStateMachine, LegalCaseStateMachine>();
        services.AddSingleton<ILegalContractStateMachine, LegalContractStateMachine>();
        services.AddSingleton<IInsuranceStateMachine, InsuranceStateMachine>();
        services.AddSingleton<IAuditRecordStateMachine, AuditRecordStateMachine>();

        // 15. Register Legal & Compliance settings
        services.Configure<LegalComplianceSettings>(
            configuration.GetSection(LegalComplianceSettings.SectionName));

        // 16. Register background services
        services.AddHostedService<OfferExpiryBackgroundService>();
        services.AddHostedService<InsuranceExpiryCheckService>();
        services.AddHostedService<ComplianceOverdueCheckService>();

        return services;
    }
}
