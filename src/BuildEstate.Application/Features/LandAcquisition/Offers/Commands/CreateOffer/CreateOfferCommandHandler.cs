using AutoMapper;
using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Features.LandAcquisition.Offers.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Commands.CreateOffer;

/// <summary>
/// Handles creation of an offer for a land opportunity.
/// Verifies the opportunity exists, sets OfferDate to UTC now
/// and Status to UnderReview before persisting.
/// When the offer amount exceeds the configurable approval threshold
/// (default 500,000), auto-creates an ApprovalRequest to block
/// opportunity transitions until Finance Director approval is granted.
/// </summary>
public sealed class CreateOfferCommandHandler : IRequestHandler<CreateOfferCommand, OfferDto>
{
    private const decimal DefaultApprovalThreshold = 500_000m;
    private const string ApprovalThresholdConfigKey = "ApprovalThreshold:OfferAmount";

    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<Offer> _offerRepository;
    private readonly IRepository<ApprovalRequest> _approvalRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CreateOfferCommandHandler> _logger;
    private readonly IMapper _mapper;

    public CreateOfferCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<Offer> offerRepository,
        IRepository<ApprovalRequest> approvalRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        INotificationService notificationService,
        IConfiguration configuration,
        ILogger<CreateOfferCommandHandler> logger,
        IMapper mapper)
    {
        _opportunityRepository = opportunityRepository;
        _offerRepository = offerRepository;
        _approvalRepository = approvalRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
        _configuration = configuration;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<OfferDto> Handle(CreateOfferCommand request, CancellationToken cancellationToken)
    {
        // Verify the opportunity exists
        var opportunity = await _opportunityRepository.GetByIdAsync(request.OpportunityId, cancellationToken);
        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.OpportunityId);
        }

        // Create offer with OfferDate = UTC now and Status = UnderReview
        var offer = new Offer
        {
            OpportunityId = request.OpportunityId,
            Amount = request.Amount,
            Currency = request.Currency,
            OfferDate = DateTime.UtcNow,
            ValidUntil = request.ValidUntil,
            Status = OfferStatus.UnderReview,
            CreatedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _offerRepository.AddAsync(offer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Auto-create ApprovalRequest when offer amount exceeds configurable threshold
        await CreateApprovalRequestIfThresholdExceeded(opportunity, request.Amount, cancellationToken);

        return _mapper.Map<OfferDto>(offer);
    }

    /// <summary>
    /// Checks the offer amount against the configurable approval threshold.
    /// If the amount meets or exceeds the threshold, creates an ApprovalRequest
    /// with Pending status. The existing transition handler blocks opportunity
    /// status changes while a pending approval exists.
    /// </summary>
    private async Task CreateApprovalRequestIfThresholdExceeded(
        LandOpportunity opportunity,
        decimal offerAmount,
        CancellationToken cancellationToken)
    {
        var threshold = _configuration.GetValue<decimal?>(ApprovalThresholdConfigKey)
            ?? DefaultApprovalThreshold;

        if (offerAmount < threshold)
        {
            return;
        }

        _logger.LogInformation(
            "Offer amount {OfferAmount} exceeds approval threshold {Threshold} for opportunity {OpportunityId}. Creating approval request.",
            offerAmount, threshold, opportunity.Id);

        var approvalRequest = new ApprovalRequest
        {
            OpportunityId = opportunity.Id,
            RequestedAmount = offerAmount,
            Status = ApprovalStatus.Pending,
            CreatedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _approvalRepository.AddAsync(approvalRequest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify the Finance Director about the new approval requirement
        await _notificationService.SendToRoleAsync(
            "FinanceDirector",
            "ApprovalCreated",
            $"A new approval request for £{offerAmount:N2} has been created for opportunity '{opportunity.Name}'. " +
            $"The offer amount exceeds the approval threshold of £{threshold:N2}.",
            approvalRequest.Id,
            cancellationToken);
    }
}
