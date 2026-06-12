using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Commands.DeleteLegalDocument;

/// <summary>
/// Validates the DeleteLegalDocumentCommand ensuring Id is not empty.
/// </summary>
public sealed class DeleteLegalDocumentCommandValidator : AbstractValidator<DeleteLegalDocumentCommand>
{
    public DeleteLegalDocumentCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Document Id is required.");
    }
}
