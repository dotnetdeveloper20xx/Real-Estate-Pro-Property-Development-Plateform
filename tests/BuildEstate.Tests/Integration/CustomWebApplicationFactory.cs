using System.Security.Claims;
using System.Text.Encodings.Web;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Persistence.Interceptors;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildEstate.Tests.Integration;

/// <summary>
/// Custom WebApplicationFactory that replaces SQL Server with InMemory database
/// and uses a fake authentication handler for test JWT tokens.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"BuildEstateTest_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureTestServices(services =>
        {
            // Remove existing DbContext registration
            var descriptorsToRemove = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<BuildEstateDbContext>)
                         || d.ServiceType == typeof(BuildEstateDbContext)
                         || d.ServiceType == typeof(DbContextOptions))
                .ToList();

            foreach (var descriptor in descriptorsToRemove)
                services.Remove(descriptor);

            // Re-register AuditInterceptor (needed for InMemory)
            services.RemoveAll<AuditInterceptor>();
            services.AddScoped<AuditInterceptor>();

            // Register InMemory database
            services.AddDbContext<BuildEstateDbContext>((sp, options) =>
            {
                var auditInterceptor = sp.GetRequiredService<AuditInterceptor>();
                options.UseInMemoryDatabase(_databaseName);
                options.AddInterceptors(auditInterceptor);
            });

            // Remove all existing authentication configuration and replace with test scheme
            services.RemoveAll<IConfigureOptions<AuthenticationOptions>>();
            services.RemoveAll<IPostConfigureOptions<AuthenticationOptions>>();

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.AuthenticationScheme;
                options.DefaultChallengeScheme = TestAuthHandler.AuthenticationScheme;
                options.DefaultScheme = TestAuthHandler.AuthenticationScheme;
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                TestAuthHandler.AuthenticationScheme, options => { });

            // Ensure database is created
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BuildEstateDbContext>();
            db.Database.EnsureCreated();
        });
    }
}

/// <summary>
/// Fake authentication handler for integration tests.
/// Reads role claims from the "X-Test-Role" header to simulate different users.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string AuthenticationScheme = "TestScheme";
    public const string TestUserIdHeader = "X-Test-UserId";
    public const string TestUserNameHeader = "X-Test-UserName";
    public const string TestRoleHeader = "X-Test-Role";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check for test role header
        var roles = Context.Request.Headers[TestRoleHeader].ToString();
        var userId = Context.Request.Headers[TestUserIdHeader].FirstOrDefault() ?? "test-user-id";
        var userName = Context.Request.Headers[TestUserNameHeader].FirstOrDefault() ?? "TestUser";

        if (string.IsNullOrEmpty(roles))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, userName),
            new(ClaimTypes.Email, $"{userName}@test.com")
        };

        // Add each role as a separate claim
        foreach (var role in roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var identity = new ClaimsIdentity(claims, AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, AuthenticationScheme);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
