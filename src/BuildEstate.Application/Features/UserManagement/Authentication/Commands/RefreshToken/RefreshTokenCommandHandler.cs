using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using BuildEstate.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.RefreshToken;

/// <summary>
/// Handles the RefreshTokenCommand by delegating to ITokenService.RefreshTokenAsync.
/// The token service internally validates that the token exists, is not expired, not revoked,
/// and not already used (beyond the 30-second grace period). It issues a new token pair
/// and marks the old refresh token as used.
/// </summary>
public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, TokenResultDto>
{
    private readonly ITokenService _tokenService;
    private readonly ILogger<RefreshTokenCommandHandler> _logger;

    public RefreshTokenCommandHandler(
        ITokenService tokenService,
        ILogger<RefreshTokenCommandHandler> logger)
    {
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<TokenResultDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Token refresh requested from IP {IpAddress}",
            request.IpAddress);

        var (accessToken, refreshToken) = await _tokenService.RefreshTokenAsync(
            request.RefreshToken,
            request.IpAddress,
            request.UserAgent,
            cancellationToken);

        _logger.LogInformation(
            "Token refresh completed successfully for IP {IpAddress}",
            request.IpAddress);

        return new TokenResultDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }
}
