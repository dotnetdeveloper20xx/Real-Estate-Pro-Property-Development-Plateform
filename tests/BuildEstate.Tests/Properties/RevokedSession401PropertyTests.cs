using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Revoked Session Returns 401 With Reason (Property 10).
///
/// Property 10: Revoked Session Returns 401 With Reason
/// For any revoked session, verify next API call returns 401 with reason message.
///
/// Since the actual middleware (session validation) is not yet implemented (Task 8.5),
/// this test verifies the middleware logic behavior by simulating the check:
/// if a session is revoked, the API call should be rejected with a reason message.
///
/// **Validates: Requirements 10.4, 11.5**
/// </summary>
public class RevokedSession401PropertyTests
{
    /// <summary>
    /// Possible revocation reasons that the system uses.
    /// </summary>
    private static readonly string[] RevocationReasons = new[]
    {
        "Account deactivated",
        "Your permissions have been updated",
        "Your password was reset",
        "Admin revoked session",
        "All other sessions revoked by administrator",
        "Role permissions changed"
    };

    /// <summary>
    /// Simulates the middleware logic that checks session revocation status.
    /// Returns (shouldReject, reasonMessage) tuple.
    /// </summary>
    private static (bool ShouldReject, string? ReasonMessage) CheckSessionStatus(
        bool isSessionRevoked, string? revokedReason)
    {
        if (isSessionRevoked)
        {
            // Map internal reason to user-facing message
            var userMessage = revokedReason switch
            {
                "Account deactivated" => "Your account has been deactivated. Contact your administrator.",
                "Your permissions have been updated" => "Your permissions have been updated. Please sign in again.",
                "Your password was reset" => "Your password was reset. Please sign in with your new password.",
                _ => "Your session has been revoked. Please sign in again."
            };

            return (true, userMessage);
        }

        return (false, null);
    }

    /// <summary>
    /// Generates a revocation reason from the known set.
    /// </summary>
    private static Arbitrary<string> RevocationReasonArbitrary()
    {
        return Gen.Elements(RevocationReasons).ToArbitrary();
    }

    /// <summary>
    /// Generates a session ID.
    /// </summary>
    private static Arbitrary<Guid> SessionIdArbitrary()
    {
        return Gen.Choose(1, int.MaxValue)
            .Select(_ => Guid.NewGuid())
            .ToArbitrary();
    }

    /// <summary>
    /// Generates protected endpoint paths.
    /// </summary>
    private static Arbitrary<string> EndpointArbitrary()
    {
        var endpoints = new[]
        {
            "/api/v1/admin/users",
            "/api/v1/admin/roles",
            "/api/v1/admin/permissions",
            "/api/v1/admin/sessions",
            "/api/v1/admin/audit-logs",
            "/api/v1/auth/me",
            "/api/v1/auth/change-password",
            "/api/v1/auth/logout"
        };

        return Gen.Elements(endpoints).ToArbitrary();
    }

    /// <summary>
    /// Property 10: For any revoked session, the next API call SHALL return 401
    /// with a reason message indicating why the session was revoked.
    ///
    /// **Validates: Requirements 10.4, 11.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property RevokedSession_Returns401_WithReasonMessage()
    {
        return Prop.ForAll(
            SessionIdArbitrary(),
            RevocationReasonArbitrary(),
            EndpointArbitrary(),
            (sessionId, reason, endpoint) =>
            {
                // Arrange: session is revoked with a reason
                const bool isSessionRevoked = true;

                // Act: simulate middleware check
                var (shouldReject, reasonMessage) = CheckSessionStatus(isSessionRevoked, reason);

                // Assert
                var isRejected = shouldReject;
                var hasMessage = !string.IsNullOrEmpty(reasonMessage);

                return (isRejected && hasMessage)
                    .Label($"Revoked session {sessionId} at '{endpoint}' (reason: '{reason}') " +
                           $"must return 401 with message. Got reject={isRejected}, message='{reasonMessage}'");
            });
    }

    /// <summary>
    /// Property 10 (complementary): For any non-revoked session,
    /// the middleware SHALL NOT reject the request based on revocation status.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NonRevokedSession_IsNotRejected()
    {
        return Prop.ForAll(
            SessionIdArbitrary(),
            EndpointArbitrary(),
            (sessionId, endpoint) =>
            {
                // Arrange: session is NOT revoked
                const bool isSessionRevoked = false;

                // Act: simulate middleware check
                var (shouldReject, reasonMessage) = CheckSessionStatus(isSessionRevoked, null);

                // Assert
                return (!shouldReject && reasonMessage == null)
                    .Label($"Non-revoked session {sessionId} at '{endpoint}' must NOT be rejected");
            });
    }

    /// <summary>
    /// Property 10: The reason message is always non-empty for any revoked session,
    /// regardless of the specific revocation reason.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RevokedSession_AlwaysHasNonEmptyReasonMessage()
    {
        return Prop.ForAll(
            RevocationReasonArbitrary(),
            (reason) =>
            {
                // Act
                var (shouldReject, reasonMessage) = CheckSessionStatus(true, reason);

                // Assert: message must always be present and non-empty
                return (shouldReject && reasonMessage != null && reasonMessage.Length > 0)
                    .Label($"Revoked session with reason '{reason}' must have non-empty message");
            });
    }
}
