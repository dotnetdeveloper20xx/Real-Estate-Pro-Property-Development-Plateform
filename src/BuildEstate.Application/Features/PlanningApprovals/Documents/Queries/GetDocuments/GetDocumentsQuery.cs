using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Documents.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Documents.Queries.GetDocuments;

/// <summary>
/// Query to retrieve a paginated list of planning documents for a given application,
/// with optional filtering by DocumentType.
/// </summary>
public sealed record GetDocumentsQuery : IRequest<PagedResult<DocumentDto>>
{
    /// <summary>The planning application to retrieve documents for.</summary>
    public Guid ApplicationId { get; init; }

    /// <summary>Optional filter by document type.</summary>
    public PlanningDocumentType? DocumentType { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;
}
