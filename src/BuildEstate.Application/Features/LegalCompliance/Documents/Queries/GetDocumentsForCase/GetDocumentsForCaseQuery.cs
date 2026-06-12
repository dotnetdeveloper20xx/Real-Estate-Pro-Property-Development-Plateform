using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Documents.Queries.GetDocumentsForCase;

/// <summary>
/// Query to retrieve a paginated, filtered list of legal documents for a specific legal case.
/// Supports filtering by DocumentType, ConfidentialityLevel, and upload date range.
/// Documents with ConfidentialityLevel = Restricted are excluded unless the user has the
/// Legal_Compliance_Officer role.
/// </summary>
public sealed record GetDocumentsForCaseQuery : IRequest<PagedResult<LegalDocumentListItemDto>>
{
    /// <summary>The legal case to retrieve documents for.</summary>
    public Guid LegalCaseId { get; init; }

    /// <summary>Optional filter by document type.</summary>
    public LegalDocumentType? DocumentType { get; init; }

    /// <summary>Optional filter by confidentiality level.</summary>
    public ConfidentialityLevel? ConfidentialityLevel { get; init; }

    /// <summary>Optional filter: documents uploaded on or after this date (UTC).</summary>
    public DateTime? DateFrom { get; init; }

    /// <summary>Optional filter: documents uploaded on or before this date (UTC).</summary>
    public DateTime? DateTo { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;
}
