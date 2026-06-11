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
    private readonly INotificationService _notificationService;
    private readonly IMapper _mapper;

    public CreateApprovalRequestCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<ApprovalRequest> approvalRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        INotificationService notificationService,
        IMapper mapper)
    {
        _opportunityRepository = opportunityRepository;
        _approvalRepository = approvalRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
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

        // Notify the Finance Director role about the new approval request
        await _notificationService.SendToRoleAsync(
            "FinanceDirector",
            "ApprovalCreated",
            $"A new approval request for £{request.RequestedAmount:N2} has been created for opportunity '{opportunity.Name}'.",
            approvalRequest.Id,
            cancellationToken);

        return _mapper.Map<ApprovalRequestDto>(approvalRequest);
    }
}
