using AutoMapper;
using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Commands.ApproveOrReject;

/// <summary>
/// Handles the approval or rejection of an existing approval request.
/// On approval: sets Status=Approved, records approver, timestamp, and notes.
/// On rejection: sets Status=Rejected, records rejection reason, and notifies the creator.
/// </summary>
public sealed class ApproveOrRejectCommandHandler
    : IRequestHandler<ApproveOrRejectCommand, ApprovalRequestDto>
{
    private readonly IRepository<ApprovalRequest> _approvalRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;
    private readonly IMapper _mapper;

    public ApproveOrRejectCommandHandler(
        IRepository<ApprovalRequest> approvalRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        INotificationService notificationService,
        IMapper mapper)
    {
        _approvalRepository = approvalRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
        _mapper = mapper;
    }

    public async Task<ApprovalRequestDto> Handle(
        ApproveOrRejectCommand request,
        CancellationToken cancellationToken)
    {
        // Retrieve the approval request
        var approvalRequest = await _approvalRepository.GetByIdAsync(request.ApprovalRequestId, cancellationToken);
        if (approvalRequest is null)
        {
            throw new EntityNotFoundException(nameof(ApprovalRequest), request.ApprovalRequestId);
        }

        if (request.IsApproved)
        {
            approvalRequest.Status = ApprovalStatus.Approved;
            approvalRequest.ApproverUserId = _currentUserService.UserId;
            approvalRequest.ApprovalTimestamp = DateTime.UtcNow;
            approvalRequest.ApprovalNotes = request.Notes;
        }
        else
        {
            approvalRequest.Status = ApprovalStatus.Rejected;
            approvalRequest.ApproverUserId = _currentUserService.UserId;
            approvalRequest.ApprovalTimestamp = DateTime.UtcNow;
            approvalRequest.RejectionReason = request.RejectionReason;

            // Notify the creator (Acquisition Manager) of the rejection
            if (!string.IsNullOrEmpty(approvalRequest.CreatedBy))
            {
                await _notificationService.SendAsync(
                    approvalRequest.CreatedBy,
                    "ApprovalRejected",
                    $"Your approval request for £{approvalRequest.RequestedAmount:N2} has been rejected. Reason: {request.RejectionReason}",
                    approvalRequest.Id,
                    cancellationToken);
            }
        }

        approvalRequest.UpdatedBy = _currentUserService.UserId;
        approvalRequest.UpdatedAt = DateTime.UtcNow;

        _approvalRepository.Update(approvalRequest);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ApprovalRequestDto>(approvalRequest);
    }
}
