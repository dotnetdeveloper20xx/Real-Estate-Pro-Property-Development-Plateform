using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Application.Settings;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.Extensions.Options;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.CreateFee;

/// <summary>
/// Handles creation of a new PlanningFee entity.
/// Validates the parent application exists, sets PaymentStatus = Pending,
/// and raises FeeRequiresApprovalDomainEvent when Amount exceeds the configured threshold.
/// </summary>
public sealed class CreateFeeCommandHandler : IRequestHandler<CreateFeeCommand, FeeDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<PlanningFee> _feeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly PlanningFeeSettings _feeSettings;

    public CreateFeeCommandHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<PlanningFee> feeRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IOptions<PlanningFeeSettings> feeSettings)
    {
        _applicationRepository = applicationRepository;
        _feeRepository = feeRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _feeSettings = feeSettings.Value;
    }

    public async Task<FeeDto> Handle(CreateFeeCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify the parent PlanningApplication exists
        var application = await _applicationRepository.GetByIdAsync(request.ApplicationId, cancellationToken);

        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.ApplicationId);
        }

        // 2. Create the PlanningFee entity with PaymentStatus = Pending
        var fee = new PlanningFee
        {
            Id = Guid.NewGuid(),
            ApplicationId = request.ApplicationId,
            Amount = request.Amount,
            Currency = request.Currency.ToUpperInvariant(),
            FeeType = request.FeeType,
            Description = request.Description,
            PaymentStatus = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        // 3. If Amount exceeds configured threshold, raise FeeRequiresApprovalDomainEvent
        if (fee.Amount > _feeSettings.ApprovalThreshold)
        {
            fee.RaiseFeeRequiresApprovalEvent();
        }

        await _feeRepository.AddAsync(fee, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<FeeDto>(fee);
    }
}
