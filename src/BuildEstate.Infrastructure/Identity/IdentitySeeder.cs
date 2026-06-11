using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace BuildEstate.Infrastructure.Identity;

/// <summary>
/// Seeds default roles and admin user for the Development environment.
/// All operations are idempotent — safe to run multiple times without creating duplicates.
/// </summary>
public static class IdentitySeeder
{
    private static readonly string[] DefaultRoles =
    [
        "SuperAdmin",
        "AcquisitionManager",
        "LegalOfficer",
        "PlanningManager",
        "ProjectManager",
        "SiteManager",
        "SalesManager",
        "CompletionManager",
        "PropertyManager",
        "FinanceDirector",
        "ValuationAnalyst",
        "Surveyor",
        "Admin"
    ];

    /// <summary>
    /// Seeds roles and a default admin user. Should only be called in Development environment.
    /// </summary>
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await SeedRolesAsync(roleManager);
        await SeedAdminUserAsync(userManager);
    }

    private static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        foreach (var roleName in DefaultRoles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var role = new ApplicationRole
                {
                    Name = roleName,
                    Description = $"{roleName} role for BuildEstate Pro platform"
                };

                await roleManager.CreateAsync(role);
            }
        }
    }

    private static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager)
    {
        const string adminEmail = "admin@buildestate.co.uk";
        const string adminPassword = "Admin@123456";

        var existingUser = await userManager.FindByEmailAsync(adminEmail);

        if (existingUser is null)
        {
            var adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                IsActive = true,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, adminPassword);

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "SuperAdmin");
            }
        }
    }
}
