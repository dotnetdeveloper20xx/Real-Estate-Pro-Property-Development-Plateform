namespace BuildEstate.API.Middleware;

/// <summary>
/// Development-only middleware that injects a default authenticated user
/// so controllers requiring User.Identity work without a real JWT token.
/// </summary>
public class DevAuthMiddleware
{
    private readonly RequestDelegate _next;

    public DevAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            var claims = new[]
            {
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "dev-user-id"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, "john.mitchell@buildestate.co.uk"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Email, "john.mitchell@buildestate.co.uk"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "AcquisitionManager"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "PlanningManager"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "LegalOfficer"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "FinanceDirector"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "SuperAdmin")
            };
            var identity = new System.Security.Claims.ClaimsIdentity(claims, "DevAuth");
            context.User = new System.Security.Claims.ClaimsPrincipal(identity);
        }
        await _next(context);
    }
}
