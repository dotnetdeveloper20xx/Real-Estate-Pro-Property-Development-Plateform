using BuildEstate.Infrastructure.Persistence.Configurations.UserManagement;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace BuildEstate.Infrastructure.Identity;

/// <summary>
/// Seeds a default admin user for the Development environment.
/// Built-in roles and permissions are seeded via EF Core migration (HasData).
/// This seeder only creates the admin user account at runtime if it doesn't exist.
/// All operations are idempotent — safe to run multiple times without creating duplicates.
/// </summary>
public static class IdentitySeeder
{
    /// <summary>
    /// Seeds a default admin user. Should only be called in Development environment.
    /// Roles are seeded via EF Core migration seed data in UserManagementSeedData.
    /// </summary>
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await SeedAdminUserAsync(userManager);
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
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminUser, adminPassword);

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "SuperAdmin");
            }
        }
    }
}
