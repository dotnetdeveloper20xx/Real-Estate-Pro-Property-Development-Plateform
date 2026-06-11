using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.DueDiligence.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Commands.TransitionDueDiligenceStatus;

/// <summary>
/// Handles due diligence status transitions using the IDueDiligenceStateMachine.
/// When transitioning to Completed or Failed, sets ReportDate to UTC now.
/// </summary>
public sealed class TransitionDueDiligenceStatusCommandHandler
    : IRequestHandler<TransitionDueDiligenceStatusCommand, DueDiligenceDto>
{
    private readonly IRepository<Domain.Entities.LandAcquisition.DueDiligence> _dueDiligenceRepository;
    private readonly IDueDiligenceStateMachine _stateMachine;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public TransitionDueDiligenceStatusCommandHandler(
        IRepository<Domain.Entities.LandAcquisition.DueDiligence> dueDiligenceRepository,
        IDueDiligenceStateMachine stateMachine,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _dueDiligenceRepository = dueDiligenceRepository;
        _stateMachine = stateMachine;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<DueDiligenceDto> Handle(
        TransitionDueDiligenceStatusCommand request,
        CancellationToken cancellationToken)
    {
        var dueDiligence = await _dueDiligenceRepository.GetByIdAsync(request.DueDiligenceId, cancellationToken);
        if (dueDiligence is null)
        {
            throw new EntityNotFoundException(nameof(Domain.Entities.LandAcquisition.DueDiligence), request.DueDiligenceId);
        }

        // Validate the transition using the state machine (throws InvalidStateTransitionException if invalid)
        _stateMachine.ValidateTransition(dueDiligence.Status, request.TargetStatus);

        // Apply the transition
        dueDiligence.Status = request.TargetStatus;

        // Set ReportDate when transitioning to Completed or Failed
        if (request.TargetStatus is DueDiligenceStatus.Completed or DueDiligenceStatus.Failed)
        {
            dueDiligence.ReportDate = DateTime.UtcNow;
        }

        // Set audit fields
        dueDiligence.UpdatedAt = DateTime.UtcNow;
        dueDiligence.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _dueDiligenceRepository.Update(dueDiligence);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<DueDiligenceDto>(dueDiligence);
    }
}
