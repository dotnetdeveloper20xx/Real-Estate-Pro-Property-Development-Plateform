using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.UpdateLegalCase;

/// <summary>
/// Handles updating an existing LegalCase entity.
/// Applies only non-null fields (partial update pattern), sets audit fields, and persists.
/// Throws EntityNotFoundException if the legal case does not exist.
/// </summary>
public sealed class UpdateLegalCaseCommandHandler : IRequestHandler<UpdateLegalCaseCommand, LegalCaseDto>
{
    private readonly IRepository<LegalCase> _legalCaseRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UpdateLegalCaseCommandHandler(
        IRepository<LegalCase> legalCaseRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _legalCaseRepository = legalCaseRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<LegalCaseDto> Handle(UpdateLegalCaseCommand request, CancellationToken cancellationToken)
    {
        var legalCase = await _legalCaseRepository.GetByIdAsync(request.Id, cancellationToken);
        if (legalCase is null)
        {
            throw new EntityNotFoundException(nameof(LegalCase), request.Id);
        }

        // Apply only non-null fields (partial update)
        if (request.Title is not null)
            legalCase.Title = request.Title;

        if (request.Description is not null)
            legalCase.Description = request.Description;

        if (request.Priority.HasValue)
            legalCase.Priority = request.Priority.Value;

        if (request.AssignedSolicitor is not null)
            legalCase.AssignedSolicitor = request.AssignedSolicitor;

        if (request.SolicitorFirm is not null)
            legalCase.SolicitorFirm = request.SolicitorFirm;

        if (request.SolicitorEmail is not null)
            legalCase.SolicitorEmail = request.SolicitorEmail;

        if (request.SolicitorPhone is not null)
            legalCase.SolicitorPhone = request.SolicitorPhone;

        if (request.Notes is not null)
            legalCase.Notes = request.Notes;

        legalCase.UpdatedAt = DateTime.UtcNow;
        legalCase.UpdatedBy = _currentUserService.UserId ?? string.Empty;

        _legalCaseRepository.Update(legalCase);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LegalCaseDto>(legalCase);
    }
}
