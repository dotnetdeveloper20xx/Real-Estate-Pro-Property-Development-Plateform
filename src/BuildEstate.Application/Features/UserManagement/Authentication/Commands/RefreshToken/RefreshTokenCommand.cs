using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.RefreshToken;

/// <summary>
/// Command to refresh an expired or soon-to-expire access token using a valid refresh token.
/// The refresh token is extracted from the HttpOnly cookie by the API layer and passed here.
/// On success, a new access token (60-minute expiry) and new refresh token are issued,
/// with a 30-second grace period on the old token to allow in-flight requests to complete.
/// </summary>
public sealed record RefreshTokenCommand : IRequest<TokenResultDto>
{
    /// <summary>The current refresh token value extracted from the HttpOnly cookie.</summary>
    public string RefreshToken { get; init; } = string.Empty;

    /// <summary>The client's IP address for security tracking and audit purposes.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>The client's User-Agent header for device identification and security tracking.</summary>
    public string UserAgent { get; init; } = string.Empty;
}
