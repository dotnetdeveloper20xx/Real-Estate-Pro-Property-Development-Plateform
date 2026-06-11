using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.UpdateLandOwner;

/// <summary>
/// Handles updating an existing LandOwner entity, setting audit fields and persisting.
/// </summary>
public sealed class UpdateLandOwnerCommandHandler : IRequestHandler<UpdateLandOwnerCommand, LandOwnerDto>
{
    private readonly IRepository<LandOwner> _landOwnerRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UpdateLandOwnerCommandHandler(
        IRepository<LandOwner> landOwnerRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _landOwnerRepository = landOwnerRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<LandOwnerDto> Handle(UpdateLandOwnerCommand request, CancellationToken cancellationToken)
    {
        var landOwner = await _landOwnerRepository.GetByIdAsync(request.Id, cancellationToken);
        if (landOwner is null)
        {
            throw new KeyNotFoundException($"Land owner with Id '{request.Id}' was not found.");
        }

        landOwner.Name = request.Name;
        landOwner.ContactDetails = request.ContactDetails;
        landOwner.Address = request.Address;
        landOwner.OwnershipType = request.OwnershipType;
        landOwner.UpdatedAt = DateTime.UtcNow;
        landOwner.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _landOwnerRepository.Update(landOwner);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LandOwnerDto>(landOwner);
    }
}
