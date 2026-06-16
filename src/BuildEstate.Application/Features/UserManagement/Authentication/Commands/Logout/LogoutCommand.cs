using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.Logout;

/// <summary>
/// Command to log out the current user by revoking their session and refresh token.
/// An audit entry is recorded for the logout action.
/// </summary>
public sealed record LogoutCommand : IRequest<Unit>
{
    /// <summary>
    /// The authenticated user's unique identifier.
    /// </summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// The current session identifier to revoke.
    /// </summary>
    public Guid SessionId { get; init; }

    /// <summary>
    /// The refresh token string to revoke.
    /// </summary>
    public string RefreshToken { get; init; } = string.Empty;

    /// <summary>
    /// The client's IP address for audit logging.
    /// </summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>
    /// Request correlation ID for distributed tracing.
    /// </summary>
    public string CorrelationId { get; init; } = string.Empty;
}
