using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Contracts.Commands.TransitionContractStatus;

/// <summary>
/// Validates the TransitionContractStatusCommand.
/// Ensures ContractId is present, TargetStatus is a valid enum value,
/// and DepositAmount is greater than zero when transitioning to Exchanged.
/// </summary>
public sealed class TransitionContractStatusCommandValidator : AbstractValidator<TransitionContractStatusCommand>
{
    public TransitionContractStatusCommandValidator()
    {
        RuleFor(x => x.ContractId)
            .NotEmpty()
            .WithMessage("ContractId is required.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("TargetStatus must be a valid ContractStatus value.");

        RuleFor(x => x.DepositAmount)
            .GreaterThan(0)
            .WithMessage("DepositAmount must be greater than zero when transitioning to Exchanged.")
            .When(x => x.TargetStatus == ContractStatus.Exchanged);
    }
}
