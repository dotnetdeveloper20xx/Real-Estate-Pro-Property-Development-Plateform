using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CompleteMilestone;

/// <summary>
/// Handles completion of a PlanningMilestone by recording the actual date,
/// updating status to Completed, and calculating variance days.
/// Positive variance indicates late completion, negative indicates early.
/// </summary>
public sealed class CompleteMilestoneCommandHandler : IRequestHandler<CompleteMilestoneCommand, MilestoneDto>
{
    private readonly IRepository<PlanningMilestone> _milestoneRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CompleteMilestoneCommandHandler(
        IRepository<PlanningMilestone> milestoneRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _milestoneRepository = milestoneRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<MilestoneDto> Handle(CompleteMilestoneCommand request, CancellationToken cancellationToken)
    {
        // 1. Load the milestone by ID
        var milestone = await _milestoneRepository.Query()
            .FirstOrDefaultAsync(m => m.Id == request.MilestoneId && !m.IsDeleted, cancellationToken);

        if (milestone is null)
        {
            throw new EntityNotFoundException(nameof(PlanningMilestone), request.MilestoneId);
        }

        // 2. Set ActualDate
        milestone.ActualDate = request.ActualDate;

        // 3. Set Status to Completed
        milestone.Status = MilestoneStatus.Completed;

        // 4. Calculate VarianceDays = (ActualDate - TargetDate).Days
        // Positive = late, Negative = early
        milestone.VarianceDays = (request.ActualDate - milestone.TargetDate).Days;

        // 5. Set audit fields
        milestone.UpdatedAt = DateTime.UtcNow;
        milestone.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        // 6. Save changes
        _milestoneRepository.Update(milestone);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<MilestoneDto>(milestone);
    }
}
