using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.Commands.UpdateCouncilContact;

/// <summary>
/// Handles updating an existing CouncilContact.
/// Finds the contact by Id, updates fields, sets audit columns, and persists.
/// </summary>
public sealed class UpdateCouncilContactCommandHandler : IRequestHandler<UpdateCouncilContactCommand, CouncilContactDto>
{
    private readonly IRepository<CouncilContact> _councilContactRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UpdateCouncilContactCommandHandler(
        IRepository<CouncilContact> councilContactRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _councilContactRepository = councilContactRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<CouncilContactDto> Handle(UpdateCouncilContactCommand request, CancellationToken cancellationToken)
    {
        var councilContact = await _councilContactRepository.GetByIdAsync(request.Id, cancellationToken);
        if (councilContact is null)
        {
            throw new EntityNotFoundException(nameof(CouncilContact), request.Id);
        }

        councilContact.CouncilName = request.CouncilName;
        councilContact.PlanningOfficerName = request.PlanningOfficerName;
        councilContact.Email = request.Email;
        councilContact.Phone = request.Phone;
        councilContact.Address = request.Address;
        councilContact.UpdatedAt = DateTime.UtcNow;
        councilContact.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _councilContactRepository.Update(councilContact);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<CouncilContactDto>(councilContact);
    }
}
