using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Authentication.Commands.RefreshToken;

/// <summary>
/// Validates the RefreshTokenCommand input before it reaches the handler.
/// Ensures the refresh token string is provided (not empty or whitespace).
/// Additional validation (token exists, not expired, not revoked, not used) is performed
/// by the TokenService during the refresh operation.
/// </summary>
public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty()
            .WithMessage("Refresh token is required.");

        RuleFor(x => x.IpAddress)
            .NotEmpty()
            .WithMessage("IP address is required.")
            .MaximumLength(45)
            .WithMessage("IP address must not exceed 45 characters.");

        RuleFor(x => x.UserAgent)
            .NotEmpty()
            .WithMessage("User agent is required.")
            .MaximumLength(512)
            .WithMessage("User agent must not exceed 512 characters.");
    }
}
