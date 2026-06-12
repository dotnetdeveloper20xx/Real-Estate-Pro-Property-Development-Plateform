using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadDocumentVersion;

/// <summary>
/// Validates the UploadDocumentVersionCommand input fields.
/// Ensures DocumentId is present, FileName is valid, ContentType is in the allowed set,
/// and FileSize is within acceptable bounds (max 50 MB).
/// </summary>
public sealed class UploadDocumentVersionCommandValidator : AbstractValidator<UploadDocumentVersionCommand>
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

    public UploadDocumentVersionCommandValidator()
    {
        RuleFor(x => x.DocumentId)
            .NotEmpty()
            .WithMessage("DocumentId is required.");

        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("FileName is required.")
            .MaximumLength(255)
            .WithMessage("FileName must not exceed 255 characters.");

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .WithMessage("ContentType is required.")
            .Must(ct => AllowedContentTypes.Contains(ct))
            .WithMessage("ContentType must be one of: PDF, DOCX, XLSX, PNG, JPG, TIFF.");

        RuleFor(x => x.FileSize)
            .GreaterThan(0)
            .WithMessage("FileSize must be greater than 0.")
            .LessThanOrEqualTo(52_428_800)
            .WithMessage("FileSize must not exceed 50 MB (52,428,800 bytes).");
    }
}
