using BuildEstate.Application.Features.UserManagement.Authentication.Commands.ChangePassword;
using BuildEstate.Application.Features.UserManagement.Users.Commands.DeactivateUser;
using BuildEstate.Application.Features.UserManagement.Users.Commands.ResetPassword;
using BuildEstate.Application.Features.UserManagement.Users.Commands.UpdateUser;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Session Revocation on Security-Critical Changes (Property 8).
///
/// Property 8: Session Revocation on Security-Critical Changes
/// For any user with one or more active sessions, performing any of the following actions
/// SHALL revoke all active sessions (both access tokens and refresh tokens):
/// - Deactivation
/// - Password change
/// - Password reset (admin-initiated)
/// - Role change
///
/// **Validates: Requirements 6.2, 7.4, 9.5, 10.1, 10.2, 10.3**
/// </summary>
public class SessionRevocationOnSecurityChangesPropertyTests
{
    #region Generators

    /// <summary>
    /// Generates a positive number of active sessions (1 to 20).
    /// </summary>
    private static Arbitrary<int> ActiveSessionCountArbitrary()
    {
        var gen = Gen.Choose(1, 20);
        return Arb.From(gen);
    }

    /// <summary>
    /// Generates a valid user ID string.
    /// </summary>
    private static Arbitrary<string> UserIdArbitrary()
    {
        var gen = from len in Gen.Choose(5, 20)
                  from chars in Gen.ArrayOf(len, Gen.Elements(
                      "abcdefghijklmnopqrstuvwxyz0123456789".ToCharArray()))
                  select new string(chars);
        return gen.ToArbitrary();
    }

    /// <summary>
    /// Generates a non-empty list of role names.
    /// </summary>
    private static Arbitrary<IList<string>> RolesArbitrary()
    {
        var roleNames = new[]
        {
            "SuperAdmin", "AcquisitionManager", "LegalOfficer", "PlanningManager",
            "ProjectManager", "SiteManager", "SalesManager", "CompletionManager",
            "PropertyManager", "FinanceDirector", "ValuationAnalyst", "Surveyor", "Admin"
        };

        var gen = from count in Gen.Choose(1, 4)
                  from roles in Gen.ArrayOf(count, Gen.Elements(roleNames))
                  select (IList<string>)roles.Distinct().ToList();

        return gen.ToArbitrary();
    }

    #endregion

    #region Property 8.1: Deactivation revokes all sessions

    /// <summary>
    /// Property 8.1: For any user with N active sessions (N >= 1), deactivation
    /// SHALL invoke RevokeAllUserSessionsAsync with the correct user ID.
    ///
    /// **Validates: Requirements 6.2, 10.1, 10.2, 10.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Deactivation_RevokesAllSessions_ForAnyUserWithActiveSessions()
    {
        return Prop.ForAll(
            UserIdArbitrary(),
            ActiveSessionCountArbitrary(),
            (userId, sessionCount) =>
            {
                // Arrange
                var sessionServiceMock = new Mock<ISessionService>();
                var tokenServiceMock = new Mock<ITokenService>();
                var userIdentityServiceMock = new Mock<IUserIdentityService>();
                var auditLogServiceMock = new Mock<IAuditLogService>();
                var loggerMock = new Mock<ILogger<DeactivateUserCommandHandler>>();

                // User exists and deactivation succeeds
                userIdentityServiceMock
                    .Setup(x => x.DeactivateUserAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(UserStatusChangeResult.Success("Test User", true));

                // Session service: user has N active sessions
                var activeSessions = Enumerable.Range(0, sessionCount)
                    .Select(_ => new UserSession
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        IsRevoked = false,
                        ExpiresAt = DateTime.UtcNow.AddDays(7)
                    })
                    .ToList();

                sessionServiceMock
                    .Setup(x => x.GetActiveSessionsAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(activeSessions);

                sessionServiceMock
                    .Setup(x => x.RevokeAllUserSessionsAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                tokenServiceMock
                    .Setup(x => x.RevokeAllUserTokensAsync(userId, It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                auditLogServiceMock
                    .Setup(x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                var handler = new DeactivateUserCommandHandler(
                    userIdentityServiceMock.Object,
                    sessionServiceMock.Object,
                    tokenServiceMock.Object,
                    auditLogServiceMock.Object,
                    loggerMock.Object);

                var command = new DeactivateUserCommand
                {
                    UserId = userId,
                    AdminUserId = "admin-001",
                    AdminUserName = "Admin User",
                    IpAddress = "192.168.1.1",
                    CorrelationId = Guid.NewGuid().ToString()
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                result.Succeeded.Should().BeTrue();

                sessionServiceMock.Verify(
                    x => x.RevokeAllUserSessionsAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
                    Times.Once,
                    $"Deactivation of user '{userId}' with {sessionCount} active sessions must revoke all sessions");

                tokenServiceMock.Verify(
                    x => x.RevokeAllUserTokensAsync(userId, It.IsAny<CancellationToken>()),
                    Times.Once,
                    $"Deactivation of user '{userId}' must revoke all tokens");

                return true;
            });
    }

    #endregion

    #region Property 8.2: Password change/reset revokes all sessions

    /// <summary>
    /// Property 8.2: For any user with N active sessions (N >= 1), password change
    /// SHALL invoke RevokeAllUserSessionsAsync with the correct user ID.
    ///
    /// **Validates: Requirements 7.4, 10.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property PasswordChange_RevokesAllSessions_ForAnyUserWithActiveSessions()
    {
        return Prop.ForAll(
            UserIdArbitrary(),
            ActiveSessionCountArbitrary(),
            (userId, sessionCount) =>
            {
                // Arrange
                var userIdentityServiceMock = new Mock<IUserIdentityService>();
                var passwordHistoryServiceMock = new Mock<IPasswordHistoryService>();
                var sessionServiceMock = new Mock<ISessionService>();
                var tokenServiceMock = new Mock<ITokenService>();
                var auditLogServiceMock = new Mock<IAuditLogService>();
                var loggerMock = new Mock<ILogger<ChangePasswordCommandHandler>>();

                // User exists and is active
                userIdentityServiceMock
                    .Setup(x => x.UserExistsAndIsActiveAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(true);

                // Current password is valid
                userIdentityServiceMock
                    .Setup(x => x.VerifyPasswordAsync(userId, "OldP@ss1", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(true);

                // Password is not reused
                passwordHistoryServiceMock
                    .Setup(x => x.IsPasswordReusedAsync(userId, "NewSecureP@ss1", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(false);

                // Password change succeeds
                userIdentityServiceMock
                    .Setup(x => x.ChangePasswordAsync(userId, "OldP@ss1", "NewSecureP@ss1", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(PasswordChangeResult.Success());

                // Get password hash for history recording
                userIdentityServiceMock
                    .Setup(x => x.GetPasswordHashAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync("hashed-password-value");

                // Display name for audit
                userIdentityServiceMock
                    .Setup(x => x.GetUserDisplayNameAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync("Test User");

                passwordHistoryServiceMock
                    .Setup(x => x.RecordPasswordChangeAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                sessionServiceMock
                    .Setup(x => x.RevokeAllUserSessionsAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                tokenServiceMock
                    .Setup(x => x.RevokeAllUserTokensAsync(userId, It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                auditLogServiceMock
                    .Setup(x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                var handler = new ChangePasswordCommandHandler(
                    userIdentityServiceMock.Object,
                    passwordHistoryServiceMock.Object,
                    sessionServiceMock.Object,
                    tokenServiceMock.Object,
                    auditLogServiceMock.Object,
                    loggerMock.Object);

                var command = new ChangePasswordCommand
                {
                    UserId = userId,
                    CurrentPassword = "OldP@ss1",
                    NewPassword = "NewSecureP@ss1",
                    IpAddress = "192.168.1.1",
                    CorrelationId = Guid.NewGuid().ToString()
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                result.Succeeded.Should().BeTrue();

                sessionServiceMock.Verify(
                    x => x.RevokeAllUserSessionsAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
                    Times.Once,
                    $"Password change for user '{userId}' with {sessionCount} active sessions must revoke all sessions");

                tokenServiceMock.Verify(
                    x => x.RevokeAllUserTokensAsync(userId, It.IsAny<CancellationToken>()),
                    Times.Once,
                    $"Password change for user '{userId}' must revoke all tokens");

                return true;
            });
    }

    /// <summary>
    /// Property 8.2b: For any user with N active sessions (N >= 1), admin-initiated password reset
    /// SHALL invoke RevokeAllUserSessionsAsync with the correct user ID.
    ///
    /// **Validates: Requirements 7.4, 10.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property PasswordReset_RevokesAllSessions_ForAnyUserWithActiveSessions()
    {
        return Prop.ForAll(
            UserIdArbitrary(),
            ActiveSessionCountArbitrary(),
            (userId, sessionCount) =>
            {
                // Arrange
                var userIdentityServiceMock = new Mock<IUserIdentityService>();
                var passwordHistoryServiceMock = new Mock<IPasswordHistoryService>();
                var sessionServiceMock = new Mock<ISessionService>();
                var tokenServiceMock = new Mock<ITokenService>();
                var auditLogServiceMock = new Mock<IAuditLogService>();
                var loggerMock = new Mock<ILogger<ResetPasswordCommandHandler>>();

                // User exists and is active
                userIdentityServiceMock
                    .Setup(x => x.UserExistsAndIsActiveAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(true);

                // Password is not reused
                passwordHistoryServiceMock
                    .Setup(x => x.IsPasswordReusedAsync(userId, "ResetP@ss1!", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(false);

                // Password reset succeeds
                userIdentityServiceMock
                    .Setup(x => x.ResetPasswordAsync(userId, "ResetP@ss1!", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(PasswordChangeResult.Success());

                // Get password hash for history recording
                userIdentityServiceMock
                    .Setup(x => x.GetPasswordHashAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync("hashed-password-value");

                // Display name for audit
                userIdentityServiceMock
                    .Setup(x => x.GetUserDisplayNameAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync("Target User");

                passwordHistoryServiceMock
                    .Setup(x => x.RecordPasswordChangeAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                sessionServiceMock
                    .Setup(x => x.RevokeAllUserSessionsAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                tokenServiceMock
                    .Setup(x => x.RevokeAllUserTokensAsync(userId, It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                auditLogServiceMock
                    .Setup(x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                var handler = new ResetPasswordCommandHandler(
                    userIdentityServiceMock.Object,
                    passwordHistoryServiceMock.Object,
                    sessionServiceMock.Object,
                    tokenServiceMock.Object,
                    auditLogServiceMock.Object,
                    loggerMock.Object);

                var command = new ResetPasswordCommand
                {
                    UserId = userId,
                    NewPassword = "ResetP@ss1!",
                    AdminUserId = "admin-001",
                    AdminUserName = "Admin User",
                    IpAddress = "192.168.1.1",
                    CorrelationId = Guid.NewGuid().ToString()
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                result.Succeeded.Should().BeTrue();

                sessionServiceMock.Verify(
                    x => x.RevokeAllUserSessionsAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
                    Times.Once,
                    $"Password reset for user '{userId}' with {sessionCount} active sessions must revoke all sessions");

                tokenServiceMock.Verify(
                    x => x.RevokeAllUserTokensAsync(userId, It.IsAny<CancellationToken>()),
                    Times.Once,
                    $"Password reset for user '{userId}' must revoke all tokens");

                return true;
            });
    }

    #endregion

    #region Property 8.3: Role change revokes all sessions

    /// <summary>
    /// Property 8.3: For any user with N active sessions (N >= 1), role change
    /// SHALL invoke RevokeAllUserSessionsAsync with the correct user ID.
    ///
    /// **Validates: Requirements 9.5, 10.1, 10.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RoleChange_RevokesAllSessions_ForAnyUserWithActiveSessions()
    {
        return Prop.ForAll(
            UserIdArbitrary(),
            ActiveSessionCountArbitrary(),
            RolesArbitrary(),
            (userId, sessionCount, newRoles) =>
            {
                // Arrange
                var identityServiceMock = new Mock<IIdentityService>();
                var sessionServiceMock = new Mock<ISessionService>();
                var tokenServiceMock = new Mock<ITokenService>();
                var auditLogServiceMock = new Mock<IAuditLogService>();
                var loggerMock = new Mock<ILogger<UpdateUserCommandHandler>>();

                // User exists
                identityServiceMock
                    .Setup(x => x.FindByIdAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new UserIdentityResult
                    {
                        UserId = userId,
                        Email = "user@buildestate.com",
                        FirstName = "Test",
                        LastName = "User",
                        IsActive = true
                    });

                // Email not changed (avoid email uniqueness check complexity)
                identityServiceMock
                    .Setup(x => x.IsEmailTakenAsync(It.IsAny<string>(), userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(false);

                // Profile update succeeds
                identityServiceMock
                    .Setup(x => x.UpdateUserAsync(userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(true);

                // Current roles are different from new roles (to trigger revocation)
                var currentRoles = new List<string> { "Admin" };
                identityServiceMock
                    .Setup(x => x.GetRolesAsync(userId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(currentRoles);

                // Role update succeeds
                identityServiceMock
                    .Setup(x => x.UpdateUserRolesAsync(userId, It.IsAny<IList<string>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(true);

                sessionServiceMock
                    .Setup(x => x.RevokeAllUserSessionsAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                tokenServiceMock
                    .Setup(x => x.RevokeAllUserTokensAsync(userId, It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                auditLogServiceMock
                    .Setup(x => x.LogAsync(It.IsAny<AuditLogEntry>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

                var handler = new UpdateUserCommandHandler(
                    identityServiceMock.Object,
                    sessionServiceMock.Object,
                    tokenServiceMock.Object,
                    auditLogServiceMock.Object,
                    loggerMock.Object);

                // Ensure new roles differ from current to trigger role change path
                var effectiveNewRoles = newRoles.Contains("Admin") && newRoles.Count == 1
                    ? new List<string> { "SuperAdmin" } // Force a difference if generated roles happen to match
                    : newRoles;

                var command = new UpdateUserCommand
                {
                    UserId = userId,
                    FirstName = "Test",
                    LastName = "User",
                    Email = "user@buildestate.com",
                    Roles = effectiveNewRoles,
                    AdminUserId = "admin-001",
                    IpAddress = "192.168.1.1",
                    CorrelationId = Guid.NewGuid().ToString()
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                result.Succeeded.Should().BeTrue();

                sessionServiceMock.Verify(
                    x => x.RevokeAllUserSessionsAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
                    Times.Once,
                    $"Role change for user '{userId}' with {sessionCount} active sessions must revoke all sessions");

                tokenServiceMock.Verify(
                    x => x.RevokeAllUserTokensAsync(userId, It.IsAny<CancellationToken>()),
                    Times.Once,
                    $"Role change for user '{userId}' must revoke all tokens");

                return true;
            });
    }

    #endregion
}
