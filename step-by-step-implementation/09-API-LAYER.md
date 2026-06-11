# Phase 9: Building the API Layer

## What You'll Build

The API layer is the front door — it receives HTTP requests, authenticates them, dispatches to MediatR, and returns HTTP responses. It also configures middleware for cross-cutting concerns.

---

## Program.cs (Application Entry Point)

This is where everything starts. It configures services and the middleware pipeline.

Key sections:
1. **Register layers** — `AddApplication()`, `AddInfrastructure()`
2. **Configure auth** — JWT Bearer tokens
3. **Configure middleware** — Exception handling, CORS, security headers
4. **Configure controllers** — JSON options, Swagger
5. **Build and run** — Middleware pipeline order matters!

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// JWT Authentication
// ... (configured as shown in Phase 4)

// Controllers + JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Swagger, CORS, Rate Limiting, Health Checks
// ...

var app = builder.Build();

// MIDDLEWARE ORDER MATTERS!
app.UseMiddleware<CorrelationIdMiddleware>();     // 1. Assign tracking ID
app.UseMiddleware<SecurityHeadersMiddleware>();   // 2. Security headers
app.UseMiddleware<GlobalExceptionHandler>();      // 3. Catch all errors
app.UseHttpsRedirection();                       // 4. Force HTTPS
app.UseCors("AllowFrontend");                    // 5. CORS
app.UseAuthentication();                          // 6. Who are you?
app.UseAuthorization();                           // 7. What can you do?
app.UseRateLimiter();                            // 8. Don't abuse the API
app.MapControllers();                            // 9. Route to controllers
app.MapHealthChecks("/health");                  // 10. Health endpoint

app.Run();
```

---

## Essential Middleware

### Global Exception Handler
Catches all unhandled exceptions and returns clean error responses.

```csharp
public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                errors = ex.Errors.Select(e => new { field = e.PropertyName, message = e.ErrorMessage })
            });
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new { success = false, errors = new[] { ex.Message } });
        }
        catch (ConflictException ex)
        {
            context.Response.StatusCode = 409;
            await context.Response.WriteAsJsonAsync(new { success = false, errors = new[] { ex.Message } });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Path}", context.Request.Path);
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                errors = new[] { "An unexpected error occurred. Please try again." }
            });
            // NOTE: Never expose ex.Message to client in production!
        }
    }
}
```

### Correlation ID Middleware
Assigns a unique tracking ID to every request for log tracing.

```csharp
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers.Append("X-Correlation-ID", correlationId);

        using (_logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
        {
            await _next(context);
        }
    }
}
```

### Security Headers Middleware
Adds protective HTTP headers to every response.

```csharp
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

        await _next(context);
    }
}
```

---

## Controller Pattern

Controllers are THIN. They do three things only:
1. Receive the request
2. Send to MediatR
3. Return the response

```csharp
[ApiController]
[Route("api/v1/opportunities")]
[Authorize]
public class OpportunitiesController : ControllerBase
{
    private readonly IMediator _mediator;

    public OpportunitiesController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Get paginated list of opportunities with optional filtering and sorting.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,AcquisitionManager")]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetOpportunitiesQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get a single opportunity by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,AcquisitionManager")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetOpportunityByIdQuery { Id = id }, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a new land opportunity.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "AcquisitionManager")]
    public async Task<IActionResult> Create(
        [FromBody] CreateOpportunityCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing opportunity.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "AcquisitionManager")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateOpportunityCommand command,
        CancellationToken cancellationToken)
    {
        command.Id = id;
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Soft-delete an opportunity.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteOpportunityCommand { Id = id }, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Change opportunity status (state machine enforced).
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "AcquisitionManager,SuperAdmin")]
    public async Task<IActionResult> ChangeStatus(
        Guid id,
        [FromBody] ChangeOpportunityStatusCommand command,
        CancellationToken cancellationToken)
    {
        command.Id = id;
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
```

---

## CurrentUserService

Extracts the current user's identity from the JWT token:

```csharp
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

    public string? UserName =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

    public string? Email =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);

    public IEnumerable<string> Roles =>
        _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role)
            .Select(c => c.Value) ?? Enumerable.Empty<string>();
}
```

---

## Testing the API

Once everything is wired up:

```bash
dotnet run --project src/BuildEstate.API
# Navigate to https://localhost:5001/swagger
# You should see all your endpoints documented
```

Use Swagger UI to:
1. Authenticate (get a JWT token via login endpoint)
2. Test each endpoint with the token
3. Verify responses match expected DTOs

---

*Next: Phase 10 — Building the Frontend Foundations (Angular setup, design system)...*
