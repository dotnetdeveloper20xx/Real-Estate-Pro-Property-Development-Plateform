using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.UpdateApplication;

/// <summary>
/// Handles updating an existing PlanningApplication entity.
/// Loads the entity by Id, updates editable fields (Description, ApplicationType,
/// CouncilName, TargetDecisionDate), records audit trail via UpdatedAt/UpdatedBy,
/// persists, and returns the mapped DTO.
/// </summary>
public sealed class UpdateApplicationCommandHandler : IRequestHandler<UpdateApplicationCommand, ApplicationDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UpdateApplicationCommandHandler(
        IRepository<PlanningApplication> applicationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _applicationRepository = applicationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<ApplicationDto> Handle(UpdateApplicationCommand request, CancellationToken cancellationToken)
    {
        // 1. Load the PlanningApplication by Id
        var application = await _applicationRepository.Query()
            .FirstOrDefaultAsync(a => a.Id == request.Id && !a.IsDeleted, cancellationToken);

        if (application is null)
        {
            throw new EntityNotFoundException(nameof(PlanningApplication), request.Id);
        }

        // 2. Update editable fields
        application.Description = request.Description;
        application.ApplicationType = request.ApplicationType;
        application.CouncilName = request.CouncilName;
        application.TargetDecisionDate = request.TargetDecisionDate;

        // 3. Record audit trail
        application.UpdatedAt = DateTime.UtcNow;
        application.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        // 4. Persist changes
        _applicationRepository.Update(application);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5. Return mapped DTO
        return _mapper.Map<ApplicationDto>(application);
    }
}
