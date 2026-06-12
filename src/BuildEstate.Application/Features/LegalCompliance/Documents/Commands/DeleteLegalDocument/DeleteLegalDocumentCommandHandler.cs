using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Exceptions;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.DeleteLegalDocument;

/// <summary>
/// Handles soft-deletion of a legal document.
/// Enforces that only users with the Legal_Compliance_Officer role can delete documents.
/// Sets IsDeleted = true, DeletedAt = UTC now, DeletedBy = current user, and persists.
/// The audit trail is recorded automatically by the AuditInterceptor.
/// </summary>
public sealed class DeleteLegalDocumentCommandHandler : IRequestHandler<DeleteLegalDocumentCommand, Unit>
{
    private readonly IRepository<LegalDocument> _documentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    private const string LegalComplianceOfficerRole = "Legal_Compliance_Officer";

    public DeleteLegalDocumentCommandHandler(
        IRepository<LegalDocument> documentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _documentRepository = documentRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(DeleteLegalDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await _documentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (document is null)
        {
            throw new EntityNotFoundException(nameof(LegalDocument), request.Id);
        }

        if (!_currentUserService.IsInRole(LegalComplianceOfficerRole))
        {
            throw new BusinessRuleViolationException(
                "DocumentDeletionRoleRestriction",
                "Only users with the Legal_Compliance_Officer role can delete legal documents.");
        }

        document.IsDeleted = true;
        document.DeletedAt = DateTime.UtcNow;
        document.DeletedBy = _currentUserService.UserId ?? string.Empty;

        _documentRepository.Update(document);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
