using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.Documents.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplicationById;

/// <summary>
/// Handles retrieval of a single planning application with all related entities
/// eager-loaded for the detail view. Includes conditions, documents, fees,
/// milestones, council contact, and a linked LandOpportunity summary.
/// Throws EntityNotFoundException if the application does not exist.
/// </summary>
public sealed class GetApplicationByIdQueryHandler
    : IRequestHandler<GetApplicationByIdQuery, ApplicationDetailDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<LandOpportunity> _opportunityRepository;

    public GetApplicationByIdQueryHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<LandOpportunity> opportunityRepository)
    {
        _applicationRepository = applicationRepository;
        _opportunityRepository = opportunityRepository;
    }

    public async Task<ApplicationDetailDto> Handle(
        GetApplicationByIdQuery request,
        CancellationToken cancellationToken)
    {
        var application = await _applicationRepository.Query()
            .AsNoTracking()
            .Include(x => x.CouncilContact)
            .Include(x => x.Conditions)
            .Include(x => x.Documents)
            .Include(x => x.Fees)
            .Include(x => x.Milestones)
            .FirstOrDefaultAsync(x => x.Id == request.ApplicationId, cancellationToken);

        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.ApplicationId);
        }

        // Retrieve linked LandOpportunity summary
        var opportunity = await _opportunityRepository.Query()
            .AsNoTracking()
            .Where(o => o.Id == application.OpportunityId)
            .Select(o => new OpportunitySummaryDto
            {
                Id = o.Id,
                Name = o.Name,
                Location = o.Location,
                LandSize = o.LandSize,
                Status = o.Status.ToString()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return new ApplicationDetailDto
        {
            Id = application.Id,
            OpportunityId = application.OpportunityId,
            Description = application.Description,
            ApplicationType = application.ApplicationType.ToString(),
            Status = application.Status.ToString(),
            ApplicationReference = application.ApplicationReference,
            CouncilName = application.CouncilName,
            SubmissionDate = application.SubmissionDate,
            TargetDecisionDate = application.TargetDecisionDate,
            ActualDecisionDate = application.ActualDecisionDate,
            DecisionDate = application.DecisionDate,
            WithdrawalReason = application.WithdrawalReason,
            CreatedAt = application.CreatedAt,
            CreatedBy = application.CreatedBy,
            UpdatedAt = application.UpdatedAt,
            UpdatedBy = application.UpdatedBy,
            CouncilContact = application.CouncilContact is not null
                ? new CouncilContactDto
                {
                    Id = application.CouncilContact.Id,
                    ApplicationId = application.CouncilContact.ApplicationId,
                    CouncilName = application.CouncilContact.CouncilName,
                    PlanningOfficerName = application.CouncilContact.PlanningOfficerName,
                    Email = application.CouncilContact.Email,
                    Phone = application.CouncilContact.Phone,
                    Address = application.CouncilContact.Address,
                    CreatedAt = application.CouncilContact.CreatedAt
                }
                : null,
            Conditions = application.Conditions
                .Select(c => new ConditionDto
                {
                    Id = c.Id,
                    ApplicationId = c.ApplicationId,
                    ConditionNumber = c.ConditionNumber,
                    Description = c.Description,
                    ConditionType = c.ConditionType.ToString(),
                    Status = c.Status.ToString(),
                    DischargeDate = c.DischargeDate,
                    DischargeReference = c.DischargeReference,
                    DueDate = c.DueDate,
                    CreatedAt = c.CreatedAt
                })
                .ToList(),
            Documents = application.Documents
                .Select(d => new DocumentDto
                {
                    Id = d.Id,
                    ApplicationId = d.ApplicationId,
                    DocumentType = d.DocumentType.ToString(),
                    FileName = d.FileName,
                    ContentType = d.ContentType,
                    FileSizeBytes = d.FileSizeBytes,
                    StoragePath = d.StoragePath,
                    UploadedAt = d.UploadedAt,
                    UploadedBy = d.UploadedBy,
                    CreatedAt = d.CreatedAt
                })
                .ToList(),
            Fees = application.Fees
                .Select(f => new FeeDto
                {
                    Id = f.Id,
                    ApplicationId = f.ApplicationId,
                    Amount = f.Amount,
                    Currency = f.Currency,
                    FeeType = f.FeeType.ToString(),
                    Description = f.Description,
                    PaymentStatus = f.PaymentStatus.ToString(),
                    ApprovedBy = f.ApprovedBy,
                    ApprovedAt = f.ApprovedAt,
                    ApprovalNotes = f.ApprovalNotes,
                    CreatedAt = f.CreatedAt
                })
                .ToList(),
            Milestones = application.Milestones
                .Select(m => new MilestoneDto
                {
                    Id = m.Id,
                    ApplicationId = m.ApplicationId,
                    MilestoneType = m.MilestoneType.ToString(),
                    Status = m.Status.ToString(),
                    TargetDate = m.TargetDate,
                    ActualDate = m.ActualDate,
                    VarianceDays = m.VarianceDays,
                    CreatedAt = m.CreatedAt
                })
                .ToList(),
            Opportunity = opportunity
        };
    }
}
