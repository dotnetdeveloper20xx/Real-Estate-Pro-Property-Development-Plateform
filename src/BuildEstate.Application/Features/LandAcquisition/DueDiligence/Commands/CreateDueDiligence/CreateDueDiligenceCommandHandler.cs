using AutoMapper;
using BuildEstate.Application.Features.LandAcquisition.DueDiligence.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Commands.CreateDueDiligence;

/// <summary>
/// Handles creation of a new DueDiligence entity.
/// Verifies the parent opportunity exists, sets Status to Pending, assigns audit fields, and persists.
/// </summary>
public sealed class CreateDueDiligenceCommandHandler
    : IRequestHandler<CreateDueDiligenceCommand, DueDiligenceDto>
{
    private readonly IRepository<Domain.Entities.LandAcquisition.DueDiligence> _dueDiligenceRepository;
    private readonly IRepository<LandOpportunity> _opportunityRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public CreateDueDiligenceCommandHandler(
        IRepository<Domain.Entities.LandAcquisition.DueDiligence> dueDiligenceRepository,
        IRepository<LandOpportunity> opportunityRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _dueDiligenceRepository = dueDiligenceRepository;
        _opportunityRepository = opportunityRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<DueDiligenceDto> Handle(CreateDueDiligenceCommand request, CancellationToken cancellationToken)
    {
        // Verify the parent opportunity exists
        var opportunity = await _opportunityRepository.GetByIdAsync(request.OpportunityId, cancellationToken);
        if (opportunity is null)
        {
            throw new KeyNotFoundException($"Land opportunity with Id '{request.OpportunityId}' was not found.");
        }

        var dueDiligence = new Domain.Entities.LandAcquisition.DueDiligence
        {
            OpportunityId = request.OpportunityId,
            Type = request.Type,
            Status = DueDiligenceStatus.Pending,
            Findings = request.Findings,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? string.Empty
        };

        await _dueDiligenceRepository.AddAsync(dueDiligence, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<DueDiligenceDto>(dueDiligence);
    }
}
