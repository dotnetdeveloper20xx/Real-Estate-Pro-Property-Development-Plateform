using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.Commands.CreateCouncilContact;

/// <summary>
/// Handles creation of a new CouncilContact for a planning application.
/// Verifies the application exists and no existing council contact is already associated.
/// </summary>
public sealed class CreateCouncilContactCommandHandler : IRequestHandler<CreateCouncilContactCommand, CouncilContactDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<CouncilContact> _councilContactRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateCouncilContactCommandHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<CouncilContact> councilContactRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _applicationRepository = applicationRepository;
        _councilContactRepository = councilContactRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<CouncilContactDto> Handle(CreateCouncilContactCommand request, CancellationToken cancellationToken)
    {
        // Verify the planning application exists
        var application = await _applicationRepository.GetByIdAsync(request.ApplicationId, cancellationToken);
        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.ApplicationId);
        }

        // Enforce one CouncilContact per application
        var existingContact = await _councilContactRepository.Query()
            .AnyAsync(c => c.ApplicationId == request.ApplicationId && !c.IsDeleted, cancellationToken);

        if (existingContact)
        {
            throw new DuplicateEntityException(nameof(CouncilContact), "ApplicationId");
        }

        var councilContact = new CouncilContact
        {
            ApplicationId = request.ApplicationId,
            CouncilName = request.CouncilName,
            PlanningOfficerName = request.PlanningOfficerName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _councilContactRepository.AddAsync(councilContact, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<CouncilContactDto>(councilContact);
    }
}
