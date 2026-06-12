using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.PlanningApprovals;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.CreateLegalCase;

/// <summary>
/// Validates the CreateLegalCaseCommand input fields.
/// Enforces field lengths, valid enums, at least one cross-module reference,
/// and existence of referenced entities.
/// </summary>
public sealed class CreateLegalCaseCommandValidator : AbstractValidator<CreateLegalCaseCommand>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<PlanningApplication> _planningApplicationRepository;

    public CreateLegalCaseCommandValidator(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<PlanningApplication> planningApplicationRepository)
    {
        _opportunityRepository = opportunityRepository;
        _planningApplicationRepository = planningApplicationRepository;

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MinimumLength(5)
            .WithMessage("Title must be at least 5 characters.")
            .MaximumLength(200)
            .WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MinimumLength(10)
            .WithMessage("Description must be at least 10 characters.")
            .MaximumLength(2000)
            .WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.CaseType)
            .IsInEnum()
            .WithMessage("CaseType must be a valid legal case type.");

        RuleFor(x => x.Priority)
            .IsInEnum()
            .WithMessage("Priority must be a valid legal case priority.");

        RuleFor(x => x)
            .Must(x => x.OpportunityId.HasValue || x.PlanningApplicationId.HasValue)
            .WithMessage("At least one of OpportunityId or PlanningApplicationId must be provided.");

        RuleFor(x => x.OpportunityId)
            .MustAsync(OpportunityExistsAsync)
            .WithMessage("The referenced OpportunityId does not correspond to an existing Land Opportunity.")
            .When(x => x.OpportunityId.HasValue);

        RuleFor(x => x.PlanningApplicationId)
            .MustAsync(PlanningApplicationExistsAsync)
            .WithMessage("The referenced PlanningApplicationId does not correspond to an existing Planning Application.")
            .When(x => x.PlanningApplicationId.HasValue);
    }

    private async Task<bool> OpportunityExistsAsync(Guid? opportunityId, CancellationToken cancellationToken)
    {
        if (!opportunityId.HasValue) return true;

        return await _opportunityRepository.Query()
            .AnyAsync(o => o.Id == opportunityId.Value && !o.IsDeleted, cancellationToken);
    }

    private async Task<bool> PlanningApplicationExistsAsync(Guid? planningApplicationId, CancellationToken cancellationToken)
    {
        if (!planningApplicationId.HasValue) return true;

        return await _planningApplicationRepository.Query()
            .AnyAsync(p => p.Id == planningApplicationId.Value && !p.IsDeleted, cancellationToken);
    }
}
