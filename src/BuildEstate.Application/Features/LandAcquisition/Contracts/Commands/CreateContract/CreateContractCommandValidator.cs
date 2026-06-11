using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Contracts.Commands.CreateContract;

/// <summary>
/// Validates the CreateContractCommand ensuring required fields are present.
/// </summary>
public sealed class CreateContractCommandValidator : AbstractValidator<CreateContractCommand>
{
    public CreateContractCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");
    }
}
