using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using BuildEstate.API.Middleware;
using BuildEstate.API.Services;
using BuildEstate.Application;
using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

// ──────────────────────────────────────────────────────────────────
// Layer DI Registration
// ──────────────────────────────────────────────────────────────────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(configuration);

// ──────────────────────────────────────────────────────────────────
// HTTP Context & Current User Service
// ──────────────────────────────────────────────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// ──────────────────────────────────────────────────────────────────
// JWT Bearer Authentication
// ──────────────────────────────────────────────────────────────────
var jwtIssuer = configuration["Jwt:Issuer"];
var jwtAudience = configuration["Jwt:Audience"];
var jwtSecretKey = configuration["Jwt:SecretKey"];

if (string.IsNullOrWhiteSpace(jwtIssuer))
    throw new InvalidOperationException("JWT configuration 'Jwt:Issuer' is missing or empty. Application cannot start.");

if (string.IsNullOrWhiteSpace(jwtAudience))
    throw new InvalidOperationException("JWT configuration 'Jwt:Audience' is missing or empty. Application cannot start.");

if (string.IsNullOrWhiteSpace(jwtSecretKey))
    throw new InvalidOperationException("JWT configuration 'Jwt:SecretKey' is missing or empty. Application cannot start.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
    };
});

builder.Services.AddAuthorization();

// ──────────────────────────────────────────────────────────────────
// Development Auth Bypass — override DefaultPolicy to allow anonymous
// ──────────────────────────────────────────────────────────────────
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddAuthorization(options =>
    {
        options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
            .RequireAssertion(_ => true)
            .Build();
        options.FallbackPolicy = null;
    });
}

// ──────────────────────────────────────────────────────────────────
// CORS — "AllowFrontend" Policy
// ──────────────────────────────────────────────────────────────────
var corsOrigins = configuration["Cors:AllowedOrigins"];

if (string.IsNullOrWhiteSpace(corsOrigins))
    throw new InvalidOperationException("CORS configuration 'Cors:AllowedOrigins' is missing or empty. Application cannot start.");

var origins = corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

if (origins.Length == 0)
    throw new InvalidOperationException("CORS configuration 'Cors:AllowedOrigins' contains no valid origins. Application cannot start.");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(origins)
              .AllowAnyMethod()
              .WithHeaders("Authorization", "Content-Type", "X-Correlation-ID", "X-CSRF-TOKEN")
              .WithExposedHeaders("X-Correlation-ID", "X-CSRF-TOKEN")
              .AllowCredentials();
    });
});

// ──────────────────────────────────────────────────────────────────
// Controllers & JSON Serialization
// ──────────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ──────────────────────────────────────────────────────────────────
// Health Checks
// ──────────────────────────────────────────────────────────────────
builder.Services.AddHealthChecks();

// ──────────────────────────────────────────────────────────────────
// Rate Limiting (Fixed Window)
// ──────────────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 10
            }));

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ──────────────────────────────────────────────────────────────────
// Swagger / OpenAPI (configured for all environments at service level,
// but UI only exposed in Development)
// ──────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BuildEstate Pro API",
        Version = "v1"
    });

    // Resolve schema ID conflicts for types with the same class name in different namespaces
    options.CustomSchemaIds(type => type.FullName?.Replace("+", ".") ?? type.Name);

    // Support IFormFile uploads in Swagger
    options.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });

    // Ignore actions that fail Swagger generation (pre-existing IFormFile issues)
    options.DocInclusionPredicate((docName, apiDesc) =>
    {
        // Exclude the Documents Upload endpoint that uses [FromForm] IFormFile
        // which the current Swashbuckle version can't handle automatically
        var actionName = apiDesc.ActionDescriptor.DisplayName ?? "";
        if (actionName.Contains("DocumentsController.Upload"))
            return false;
        return true;
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by a space and the JWT token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// Build the Application
// ══════════════════════════════════════════════════════════════════
var app = builder.Build();

// ──────────────────────────────────────────────────────────────────
// Swagger UI — Development only
// ──────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "BuildEstate Pro API v1");
    });
}

// ──────────────────────────────────────────────────────────────────
// Middleware Pipeline (order matters)
// ──────────────────────────────────────────────────────────────────
// 1. Correlation ID
app.UseMiddleware<CorrelationIdMiddleware>();

// 2. Security Headers
app.UseSecurityHeaders();

// 3. Global Exception Handler
app.UseGlobalExceptionHandler();

// 4. HTTPS Redirection
app.UseHttpsRedirection();

// 5. CORS
app.UseCors("AllowFrontend");

// 6. Authentication
app.UseAuthentication();

// 6.5. Development Auth Middleware — inject default user claims when no JWT present
if (app.Environment.IsDevelopment())
{
    app.UseMiddleware<DevAuthMiddleware>();
}

// 7. Authorization
app.UseAuthorization();

// 7.5 Session Validation — check user still active and sessions not revoked
app.UseSessionValidation();

// 7.6 CSRF Validation — validate X-CSRF-TOKEN on state-changing requests
app.UseCsrfValidation();

// 8. Rate Limiting
app.UseRateLimiter();

// 9. Controllers
app.MapControllers();

// 10. Health Checks
app.MapHealthChecks("/health").AllowAnonymous();

// ──────────────────────────────────────────────────────────────────
// Identity Seeding — Development environment only
// ──────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await IdentitySeeder.SeedAsync(scope.ServiceProvider);
    await DemoDataSeeder.SeedAsync(scope.ServiceProvider);
}

app.Run();

// Make the implicit Program class accessible for integration testing with WebApplicationFactory
public partial class Program { }
