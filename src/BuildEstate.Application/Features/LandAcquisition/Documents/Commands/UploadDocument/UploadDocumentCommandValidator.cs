using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Commands.UploadDocument;

/// <summary>
/// Validates the UploadDocumentCommand ensuring OpportunityId is not empty,
/// DocType is a valid enum, file size does not exceed 25MB,
/// and content type is in the allowed list.
/// </summary>
public sealed class UploadDocumentCommandValidator : AbstractValidator<UploadDocumentCommand>
{
    private const long MaxFileSizeBytes = 26_214_400; // 25 MB

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg"
    };

    public UploadDocumentCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");

        RuleFor(x => x.DocType)
            .IsInEnum()
            .WithMessage("DocType must be a valid document type.");

        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("FileName is required.");

        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0)
            .WithMessage("File size must be greater than zero.")
            .LessThanOrEqualTo(MaxFileSizeBytes)
            .WithMessage("File size must not exceed 25 MB (26,214,400 bytes).");

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .WithMessage("ContentType is required.")
            .Must(ct => AllowedContentTypes.Contains(ct))
            .WithMessage("ContentType must be one of: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, image/png, image/jpeg.");
    }
}
