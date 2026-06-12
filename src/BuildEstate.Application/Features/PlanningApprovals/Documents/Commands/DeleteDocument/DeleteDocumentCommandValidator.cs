using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Commands.DeleteDocument;

/// <summary>
/// Validates the DeleteDocumentCommand ensuring DocumentId is not empty.
/// </summary>
public sealed class DeleteDocumentCommandValidator : AbstractValidator<DeleteDocumentCommand>
{
    public DeleteDocumentCommandValidator()
    {
        RuleFor(x => x.DocumentId)
            .NotEmpty()
            .WithMessage("DocumentId is required.");
    }
}
