using Microsoft.AspNetCore.Authorization;

namespace BuildEstate.Application.Authorization;

/// <summary>
/// Evaluates <see cref="PermissionRequirement"/> by checking the user's "permission" claims.
/// SuperAdmin role bypasses all permission checks automatically.
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        // SuperAdmin bypasses all permission checks
        if (context.User.IsInRole("SuperAdmin"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check for the specific permission claim in the JWT
        if (context.User.HasClaim("permission", requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
