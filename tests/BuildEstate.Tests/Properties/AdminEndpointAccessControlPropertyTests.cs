using System.Reflection;
using BuildEstate.API.Controllers.Admin;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Authorization;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Admin Endpoints Reject Non-SuperAdmin With 403 (Property 15).
///
/// Property 15: Admin Endpoints Reject Non-SuperAdmin With 403
/// For any non-SuperAdmin user and any admin endpoint, verify 403 Forbidden with no admin data leaked.
///
/// This test uses reflection to verify that all admin controllers have the
/// [Authorize(Roles = "SuperAdmin")] attribute, ensuring non-SuperAdmin users receive 403.
///
/// **Validates: Requirements 18.1, 18.3, 18.5**
/// </summary>
public class AdminEndpointAccessControlPropertyTests
{
    /// <summary>
    /// All admin controller types that must be restricted to SuperAdmin.
    /// </summary>
    private static readonly Type[] AdminControllerTypes = new[]
    {
        typeof(UsersController),
        typeof(RolesController),
        typeof(PermissionsController),
        typeof(AuditLogsController),
        typeof(SessionsController)
    };

    /// <summary>
    /// Non-SuperAdmin roles that should be denied access.
    /// </summary>
    private static readonly string[] NonSuperAdminRoles = new[]
    {
        "AcquisitionManager", "LegalOfficer", "PlanningManager",
        "ProjectManager", "SiteManager", "SalesManager",
        "CompletionManager", "PropertyManager", "FinanceDirector",
        "ValuationAnalyst", "Surveyor", "Admin"
    };

    /// <summary>
    /// Generates a non-SuperAdmin role from the built-in role set.
    /// </summary>
    private static Arbitrary<string> NonSuperAdminRoleArbitrary()
    {
        return Gen.Elements(NonSuperAdminRoles).ToArbitrary();
    }

    /// <summary>
    /// Generates an admin controller type from the known set.
    /// </summary>
    private static Arbitrary<Type> AdminControllerTypeArbitrary()
    {
        return Gen.Elements(AdminControllerTypes).ToArbitrary();
    }

    /// <summary>
    /// Checks if a controller class has [Authorize(Roles = "SuperAdmin")] at the class level.
    /// </summary>
    private static bool HasSuperAdminAuthorizeAttribute(Type controllerType)
    {
        var authorizeAttributes = controllerType
            .GetCustomAttributes<AuthorizeAttribute>(inherit: true)
            .ToList();

        return authorizeAttributes.Any(a =>
            a.Roles != null &&
            a.Roles.Split(',').Select(r => r.Trim()).Contains("SuperAdmin"));
    }

    /// <summary>
    /// Checks if a role would be granted access based on the Authorize attribute's roles string.
    /// Returns true if the role IS in the allowed roles (i.e., would be granted access).
    /// </summary>
    private static bool WouldRoleBeGrantedAccess(Type controllerType, string role)
    {
        var authorizeAttributes = controllerType
            .GetCustomAttributes<AuthorizeAttribute>(inherit: true)
            .ToList();

        foreach (var attr in authorizeAttributes)
        {
            if (string.IsNullOrEmpty(attr.Roles))
                continue; // No role restriction — would need auth but not specific role

            var allowedRoles = attr.Roles.Split(',').Select(r => r.Trim());
            if (allowedRoles.Contains(role))
                return true;
        }

        return false;
    }

    /// <summary>
    /// Property 15: For any admin controller, the [Authorize(Roles = "SuperAdmin")] attribute
    /// SHALL be present at the class level, ensuring non-SuperAdmin users receive 403.
    ///
    /// **Validates: Requirements 18.1, 18.3, 18.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property AdminControllers_HaveSuperAdminAuthorizeAttribute()
    {
        return Prop.ForAll(
            AdminControllerTypeArbitrary(),
            controllerType =>
            {
                var hasSuperAdminAuth = HasSuperAdminAuthorizeAttribute(controllerType);

                return hasSuperAdminAuth
                    .Label($"Admin controller '{controllerType.Name}' must have [Authorize(Roles = \"SuperAdmin\")] attribute");
            });
    }

    /// <summary>
    /// Property 15: For any non-SuperAdmin role and any admin controller,
    /// the role SHALL NOT be granted access.
    ///
    /// **Validates: Requirements 18.1, 18.3, 18.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NonSuperAdminRole_IsNotGrantedAccess_ToAnyAdminController()
    {
        return Prop.ForAll(
            NonSuperAdminRoleArbitrary(),
            AdminControllerTypeArbitrary(),
            (role, controllerType) =>
            {
                var wouldBeGranted = WouldRoleBeGrantedAccess(controllerType, role);

                return (!wouldBeGranted)
                    .Label($"Non-SuperAdmin role '{role}' must NOT be granted access to '{controllerType.Name}'");
            });
    }

    /// <summary>
    /// Property 15 (complementary): The SuperAdmin role SHALL be granted access to all admin controllers.
    /// </summary>
    [Property(MaxTest = 50)]
    public Property SuperAdminRole_IsGrantedAccess_ToAllAdminControllers()
    {
        return Prop.ForAll(
            AdminControllerTypeArbitrary(),
            controllerType =>
            {
                var wouldBeGranted = WouldRoleBeGrantedAccess(controllerType, "SuperAdmin");

                return wouldBeGranted
                    .Label($"SuperAdmin role must be granted access to '{controllerType.Name}'");
            });
    }

    /// <summary>
    /// Deterministic verification: all admin controllers have the correct authorization.
    /// This ensures complete coverage regardless of FsCheck sampling.
    /// </summary>
    [Fact]
    public void AllAdminControllers_HaveSuperAdminAuthorizeAttribute()
    {
        foreach (var controllerType in AdminControllerTypes)
        {
            HasSuperAdminAuthorizeAttribute(controllerType)
                .Should().BeTrue(
                    $"Admin controller '{controllerType.Name}' must have [Authorize(Roles = \"SuperAdmin\")] attribute");
        }
    }

    /// <summary>
    /// Deterministic verification: no non-SuperAdmin role has access to any admin controller.
    /// </summary>
    [Fact]
    public void NoNonSuperAdminRole_HasAccessToAdminControllers()
    {
        foreach (var controllerType in AdminControllerTypes)
        {
            foreach (var role in NonSuperAdminRoles)
            {
                WouldRoleBeGrantedAccess(controllerType, role)
                    .Should().BeFalse(
                        $"Role '{role}' must NOT have access to admin controller '{controllerType.Name}'");
            }
        }
    }
}
