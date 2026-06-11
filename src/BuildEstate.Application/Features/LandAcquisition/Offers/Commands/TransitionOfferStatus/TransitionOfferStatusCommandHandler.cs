using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Offers.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Offers.Commands.TransitionOfferStatus;

/// <summary>
/// Handles offer status transitions using the IOfferStateMachine.
/// When transitioning to Accepted and the opportunity is in OfferMade status,
/// auto-transitions the opportunity to UnderContract via IOpportunityStateMachine.
/// When transitioning to CounterOffered, stores CounterOfferAmount and OriginalOfferId.
/// </summary>
public sealed class TransitionOfferStatusCommandHandler : IRequestHandler<TransitionOfferStatusCommand, OfferDto>
{
    private readonly IRepository<Offer> _offerRepository;
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IOfferStateMachine _offerStateMachine;
    private readonly IOpportunityStateMachine _opportunityStateMachine;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public TransitionOfferStatusCommandHandler(
        IRepository<Offer> offerRepository,
        IRepository<LandOpportunity> opportunityRepository,
        IOfferStateMachine offerStateMachine,
        IOpportunityStateMachine opportunityStateMachine,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _offerRepository = offerRepository;
        _opportunityRepository = opportunityRepository;
        _offerStateMachine = offerStateMachine;
        _opportunityStateMachine = opportunityStateMachine;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<OfferDto> Handle(TransitionOfferStatusCommand request, CancellationToken cancellationToken)
    {
        // Find the offer with its associated opportunity
        var offer = await _offerRepository.Query()
            .Include(o => o.Opportunity)
            .FirstOrDefaultAsync(o => o.Id == request.OfferId, cancellationToken);

        if (offer is null)
        {
            throw new EntityNotFoundException(nameof(Offer), request.OfferId);
        }

        // Validate the transition using the offer state machine (throws if invalid)
        _offerStateMachine.ValidateTransition(offer.Status, request.TargetStatus);

        // Handle CounterOffered: store CounterOfferAmount and OriginalOfferId
        if (request.TargetStatus == OfferStatus.CounterOffered)
        {
            offer.CounterOfferAmount = request.CounterOfferAmount;
            offer.OriginalOfferId = request.OriginalOfferId;
        }

        // Handle Accepted: auto-transition opportunity to UnderContract if currently OfferMade
        if (request.TargetStatus == OfferStatus.Accepted
            && offer.Opportunity.Status == OpportunityStatus.OfferMade)
        {
            _opportunityStateMachine.ValidateTransition(
                offer.Opportunity.Status,
                OpportunityStatus.UnderContract);

            offer.Opportunity.Status = OpportunityStatus.UnderContract;
            offer.Opportunity.UpdatedAt = DateTime.UtcNow;
            offer.Opportunity.UpdatedBy = _currentUserService.UserId ?? string.Empty;

            _opportunityRepository.Update(offer.Opportunity);
        }

        // Apply the offer status transition
        offer.Status = request.TargetStatus;
        offer.UpdatedAt = DateTime.UtcNow;
        offer.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _offerRepository.Update(offer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<OfferDto>(offer);
    }
}
