using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.Login;

/// <summary>
/// Handles user login by verifying credentials, checking account status and lockout,
/// generating tokens, creating a session, updating LastLoginAt, logging an audit entry,
/// and resetting the failed attempt counter on success.
///
/// On failure: increments failed attempts, checks lockout, and returns a generic error
/// message that does not reveal which field (email or password) was incorrect.
/// </summary>
public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IIdentityService _identityService;
    private readonly IAccountLockoutService _lockoutService;
    private readonly ITokenService _tokenService;
    private readonly ISessionService _sessionService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IIdentityService identityService,
        IAccountLockoutService lockoutService,
        ITokenService tokenService,
        ISessionService sessionService,
        IAuditLogService auditLogService,
        ILogger<LoginCommandHandler> logger)
    {
        _identityService = identityService;
        _lockoutService = lockoutService;
        _tokenService = tokenService;
        _sessionService = sessionService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // 1. Find user by email
        var user = await _identityService.FindByEmailAsync(request.Email, cancellationToken);
        if (user is null)
        {
            _logger.LogWarning("Login failed — user not found for email {Email}", request.Email);
            return LoginResult.Failure("Invalid email or password.");
        }

        // 2. Check if the account is active
        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed — user {UserId} is deactivated", user.UserId);
            return LoginResult.Failure("Account is deactivated. Contact your administrator.");
        }

        // 3. Check if the account is currently locked out
        if (await _lockoutService.IsLockedOutAsync(user.UserId, cancellationToken))
        {
            var remaining = await _lockoutService.GetRemainingLockoutTimeAsync(user.UserId, cancellationToken);
            var minutes = (int)Math.Ceiling(remaining.TotalMinutes);
            _logger.LogWarning("Login failed — user {UserId} is locked out for {Minutes} more minutes", user.UserId, minutes);
            return LoginResult.Failure($"Account locked due to too many failed attempts. Try again in {minutes} minutes.");
        }

        // 4. Verify password
        var passwordValid = await _identityService.CheckPasswordAsync(user.UserId, request.Password, cancellationToken);
        if (!passwordValid)
        {
            // Increment failed attempts — may trigger lockout
            var isNowLocked = await _lockoutService.IncrementFailedAttemptsAsync(user.UserId, cancellationToken);
            if (isNowLocked)
            {
                _logger.LogWarning("User {UserId} locked out after too many failed attempts", user.UserId);
                return LoginResult.Failure("Account locked due to too many failed attempts. Try again in 15 minutes.");
            }

            _logger.LogWarning("Login failed — invalid password for user {UserId}", user.UserId);
            return LoginResult.Failure("Invalid email or password.");
        }

        // 5. Success path — reset failed attempts
        await _lockoutService.ResetFailedAttemptsAsync(user.UserId, cancellationToken);

        // 6. Get user roles
        var roles = await _identityService.GetRolesAsync(user.UserId, cancellationToken);

        // 7. Generate tokens
        var (accessToken, refreshToken) = await _tokenService.GenerateTokensAsync(
            user.UserId, user.Email, user.FirstName, user.LastName,
            roles, request.RememberMe, request.UserAgent, request.IpAddress, cancellationToken);

        // 8. Create session
        await _sessionService.CreateSessionAsync(user.UserId, request.IpAddress, request.UserAgent, cancellationToken);

        // 9. Update LastLoginAt
        await _identityService.UpdateLastLoginAsync(user.UserId, cancellationToken);

        // 10. Log audit entry
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "UserLogin",
            PerformedByUserId = user.UserId,
            PerformedByUserName = $"{user.FirstName} {user.LastName}",
            TargetEntityType = "User",
            TargetEntityId = user.UserId,
            TargetUserName = $"{user.FirstName} {user.LastName}",
            IpAddress = request.IpAddress,
            CorrelationId = request.CorrelationId,
            Details = "User logged in successfully."
        }, cancellationToken);

        _logger.LogInformation("User {UserId} logged in successfully", user.UserId);

        // 11. Build and return response
        var response = new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new LoginUserDto
            {
                Id = user.UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles.ToList().AsReadOnly()
            }
        };

        return LoginResult.Success(response);
    }
}
