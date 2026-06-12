using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.ApproveFee;

/// <summary>
/// Handles approval of a planning fee by the Finance Director.
/// Validates the fee exists and is in AwaitingApproval status before approving.
/// Records the approver identity, approval timestamp, and approval notes.
/// </summary>
public sealed class ApproveFeeCommandHandler : IRequestHandler<ApproveFeeCommand, FeeDto>
{
    private readonly IRepository<PlanningFee> _feeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public ApproveFeeCommandHandler(
        IRepository<PlanningFee> feeRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _feeRepository = feeRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<FeeDto> Handle(ApproveFeeCommand request, CancellationToken cancellationToken)
    {
        // 1. Load the fee by ID
        var fee = await _feeRepository.GetByIdAsync(request.FeeId, cancellationToken);

        if (fee is null)
        {
            throw new EntityNotFoundException(nameof(PlanningFee), request.FeeId);
        }

        // 2. Validate that the fee is in AwaitingApproval status
        if (fee.PaymentStatus != PaymentStatus.AwaitingApproval)
        {
            throw new BusinessRuleViolationException(
                "FeeApprovalRequiresAwaitingApprovalStatus",
                $"Fee can only be approved when in '{nameof(PaymentStatus.AwaitingApproval)}' status. " +
                $"Current status is '{fee.PaymentStatus}'.");
        }

        // 3. Set PaymentStatus to Approved
        fee.PaymentStatus = PaymentStatus.Approved;

        // 4. Record approval details
        fee.ApprovedBy = _currentUserService.UserId ?? string.Empty;
        fee.ApprovedAt = DateTime.UtcNow;
        fee.ApprovalNotes = request.ApprovalNotes;

        // 5. Set audit fields
        fee.UpdatedAt = DateTime.UtcNow;
        fee.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _feeRepository.Update(fee);

        // 6. Save changes
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<FeeDto>(fee);
    }
}
