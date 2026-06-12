using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadLegalDocument;

/// <summary>
/// Validates the UploadLegalDocumentCommand input fields.
/// Enforces at least one parent link (LegalCaseId or ContractId), valid enums,
/// allowed content types, file size ≤ 50MB, and existence of referenced entities.
/// </summary>
public sealed class UploadLegalDocumentCommandValidator : AbstractValidator<UploadLegalDocumentCommand>
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg",
        "image/tiff"
    };

    private const long MaxFileSizeBytes = 52_428_800; // 50 MB

    private readonly IRepository<LegalCase> _legalCaseRepository;
    private readonly IRepository<Contract> _contractRepository;

    public UploadLegalDocumentCommandValidator(
        IRepository<LegalCase> legalCaseRepository,
        IRepository<Contract> contractRepository)
    {
        _legalCaseRepository = legalCaseRepository;
        _contractRepository = contractRepository;

        RuleFor(x => x)
            .Must(x => x.LegalCaseId.HasValue || x.ContractId.HasValue)
            .WithMessage("At least one of LegalCaseId or ContractId must be provided.");

        RuleFor(x => x.DocumentType)
            .IsInEnum()
            .WithMessage("DocumentType must be a valid legal document type.");

        RuleFor(x => x.ConfidentialityLevel)
            .IsInEnum()
            .WithMessage("ConfidentialityLevel must be a valid confidentiality level.");

        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("FileName is required.")
            .MaximumLength(255)
            .WithMessage("FileName must not exceed 255 characters.");

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .WithMessage("ContentType is required.")
            .Must(ct => AllowedContentTypes.Contains(ct))
            .WithMessage("ContentType must be one of: PDF, DOCX, XLSX, PNG, JPG, or TIFF.");

        RuleFor(x => x.FileSize)
            .GreaterThan(0)
            .WithMessage("FileSize must be greater than zero.")
            .LessThanOrEqualTo(MaxFileSizeBytes)
            .WithMessage("FileSize must not exceed 50 MB (52,428,800 bytes).");

        RuleFor(x => x.StoragePath)
            .NotEmpty()
            .WithMessage("StoragePath is required.");

        RuleFor(x => x.LegalCaseId)
            .MustAsync(LegalCaseExistsAsync)
            .WithMessage("The referenced LegalCaseId does not correspond to an existing Legal Case.")
            .When(x => x.LegalCaseId.HasValue);

        RuleFor(x => x.ContractId)
            .MustAsync(ContractExistsAsync)
            .WithMessage("The referenced ContractId does not correspond to an existing Contract.")
            .When(x => x.ContractId.HasValue);
    }

    private async Task<bool> LegalCaseExistsAsync(Guid? legalCaseId, CancellationToken cancellationToken)
    {
        if (!legalCaseId.HasValue) return true;

        return await _legalCaseRepository.Query()
            .AnyAsync(lc => lc.Id == legalCaseId.Value && !lc.IsDeleted, cancellationToken);
    }

    private async Task<bool> ContractExistsAsync(Guid? contractId, CancellationToken cancellationToken)
    {
        if (!contractId.HasValue) return true;

        return await _contractRepository.Query()
            .AnyAsync(c => c.Id == contractId.Value && !c.IsDeleted, cancellationToken);
    }
}
