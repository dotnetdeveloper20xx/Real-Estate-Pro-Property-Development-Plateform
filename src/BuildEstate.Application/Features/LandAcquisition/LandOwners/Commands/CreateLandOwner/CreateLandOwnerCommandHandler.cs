using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.CreateLandOwner;

/// <summary>
/// Handles creation of a new LandOwner entity, setting audit fields and persisting.
/// </summary>
public sealed class CreateLandOwnerCommandHandler : IRequestHandler<CreateLandOwnerCommand, LandOwnerDto>
{
    private readonly IRepository<LandOwner> _landOwnerRepository;
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateLandOwnerCommandHandler(
        IRepository<LandOwner> landOwnerRepository,
        IRepository<LandOpportunity> opportunityRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _landOwnerRepository = landOwnerRepository;
        _opportunityRepository = opportunityRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<LandOwnerDto> Handle(CreateLandOwnerCommand request, CancellationToken cancellationToken)
    {
        // Verify the opportunity exists
        var opportunity = await _opportunityRepository.GetByIdAsync(request.OpportunityId, cancellationToken);
        if (opportunity is null)
        {
            throw new KeyNotFoundException($"Land opportunity with Id '{request.OpportunityId}' was not found.");
        }

        var landOwner = new LandOwner
        {
            OpportunityId = request.OpportunityId,
            Name = request.Name,
            ContactDetails = request.ContactDetails,
            Address = request.Address,
            OwnershipType = request.OwnershipType,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _landOwnerRepository.AddAsync(landOwner, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LandOwnerDto>(landOwner);
    }
}
