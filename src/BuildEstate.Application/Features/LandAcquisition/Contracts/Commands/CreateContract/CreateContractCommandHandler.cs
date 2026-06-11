using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.Contracts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Contracts.Commands.CreateContract;

/// <summary>
/// Handles creation of a contract for a land opportunity.
/// Verifies the opportunity exists and has at least one accepted offer before creating.
/// </summary>
public sealed class CreateContractCommandHandler : IRequestHandler<CreateContractCommand, ContractDto>
{
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IRepository<Contract> _contractRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateContractCommandHandler(
        IRepository<LandOpportunity> opportunityRepository,
        IRepository<Contract> contractRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _opportunityRepository = opportunityRepository;
        _contractRepository = contractRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<ContractDto> Handle(CreateContractCommand request, CancellationToken cancellationToken)
    {
        // Verify opportunity exists with its offers loaded
        var opportunity = await _opportunityRepository.Query()
            .Include(o => o.Offers)
            .FirstOrDefaultAsync(o => o.Id == request.OpportunityId, cancellationToken);

        if (opportunity is null)
        {
            throw new EntityNotFoundException(nameof(LandOpportunity), request.OpportunityId);
        }

        // Check that at least one offer has been accepted
        var hasAcceptedOffer = opportunity.Offers.Any(o => o.Status == OfferStatus.Accepted);
        if (!hasAcceptedOffer)
        {
            throw new BusinessRuleViolationException(
                "ContractRequiresAcceptedOffer",
                "A contract can only be created for an opportunity that has at least one accepted offer.");
        }

        // Create contract with Draft status
        var contract = new Contract
        {
            OpportunityId = request.OpportunityId,
            Status = ContractStatus.Draft,
            SolicitorName = request.SolicitorName,
            SolicitorFirm = request.SolicitorFirm,
            SolicitorContact = request.SolicitorContact,
            CreatedBy = _currentUserService.UserId ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _contractRepository.AddAsync(contract, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ContractDto>(contract);
    }
}
