using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Commands.UploadDocument;

/// <summary>
/// Validates the UploadDocumentCommand ensuring ApplicationId is not empty,
/// DocumentType is a valid enum, file size does not exceed 50MB,
/// file name is not empty (max 256 chars), and content type is in the allowed list.
/// </summary>
public sealed class UploadDocumentCommandValidator : AbstractValidator<UploadDocumentCommand>
{
    private const long MaxFileSizeBytes = 52_428_800; // 50 MB

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg",
        "application/dwg",
        "application/dxf"
    };

    public UploadDocumentCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty()
            .WithMessage("ApplicationId is required.");

        RuleFor(x => x.DocumentType)
            .IsInEnum()
            .WithMessage("DocumentType must be a valid planning document type.");

        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("FileName is required.")
            .MaximumLength(256)
            .WithMessage("FileName must not exceed 256 characters.");

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .WithMessage("ContentType is required.")
            .Must(ct => AllowedContentTypes.Contains(ct))
            .WithMessage("ContentType must be one of: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, image/png, image/jpeg, application/dwg, application/dxf.");

        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0)
            .WithMessage("File size must be greater than zero.")
            .LessThanOrEqualTo(MaxFileSizeBytes)
            .WithMessage("File size must not exceed 50 MB (52,428,800 bytes).");
    }
}
