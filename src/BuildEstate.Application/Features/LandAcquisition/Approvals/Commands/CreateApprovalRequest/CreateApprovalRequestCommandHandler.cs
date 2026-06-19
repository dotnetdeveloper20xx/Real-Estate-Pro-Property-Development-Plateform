using AutoMapper;
using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Commands.CreateApprovalRequest;

/// <summary>
/// Handles creation of an approval request for a land opportunity.
/// Verifies the opportunity exists, creates the ApprovalRequest with Status=Pending,
/// notifies the Finance Director via INotificationService, and returns the DTO.
/// </summary>
public sealed class CreateApprovalRequestCommandHandler
    : IRequestHandler<CreateApprovalRequestCommand, ApprovalRequestDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<ApprovalRequest> _approvalRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationEngine _notificationEngine;
    private readonly IMapper _mapper;

    public CreateApprovalRequestCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<ApprovalRequest> approvalRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        INotificationEngine notificationEngine,
        IMapper mapper)
    {
        _opportunityRepository = opportunityRepository;
        _approvalRepository = approvalRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _notificationEngine = notificationEngine;
        _mapper = mapper;
    }

    public async Task<ApprovalRequestDto> Handle(
        CreateApprovalRequestCommand request,
        CancellationToken cancellationToken)
    {
        // Verify the opportunity exists
        var opportunity = await _opportunityRepository.GetByIdAsync(request.OpportunityId, cancellationToken);
        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.OpportunityId);
        }

        // Create approval request with Status = Pending
        var approvalRequest = new ApprovalRequest
        {
            OpportunityId = request.OpportunityId,
            RequestedAmount = request.RequestedAmount,
            Status = ApprovalStatus.Pending,
            CreatedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _approvalRepository.AddAsync(approvalRequest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify via notification engine — rules determine recipients
        await _notificationEngine.EmitAsync(new NotificationEvent
        {
            EventType = "ApprovalRequested",
            Module = "LandAcquisition",
            EntityId = opportunity.Id,
            EntityType = "LandOpportunity",
            RelatedUrl = $"/land-acquisition/opportunities/{opportunity.Id}",
            Variables = new Dictionary<string, string>
            {
                ["opportunityName"] = opportunity.Name,
                ["amount"] = request.RequestedAmount.ToString("N2")
            },
            TriggeredByUserId = _currentUserService.UserId
        }, cancellationToken);

        return _mapper.Map<ApprovalRequestDto>(approvalRequest);
    }
}
