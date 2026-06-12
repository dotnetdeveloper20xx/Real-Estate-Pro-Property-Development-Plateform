using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Queries.GetContracts;

/// <summary>
/// Query to retrieve a paginated, filtered, sorted, and searchable list of contracts.
/// Supports filtering by Status, ContractType, LegalCaseId, and free-text search across
/// Title, ContractReference, and CounterpartyName fields.
/// </summary>
public sealed record GetContractsQuery : IRequest<PagedResult<ContractListItemDto>>
{
    /// <summary>Optional filter by contract status.</summary>
    public LegalContractStatus? Status { get; init; }

    /// <summary>Optional filter by contract type.</summary>
    public LegalContractType? ContractType { get; init; }

    /// <summary>Optional filter by linked legal case.</summary>
    public Guid? LegalCaseId { get; init; }

    /// <summary>Optional free-text search across Title, ContractReference, and CounterpartyName.</summary>
    public string? SearchTerm { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>Optional sort field: Title, ContractReference, CreatedAt, Status, ContractType, ContractValue, StartDate, EndDate.</summary>
    public string? SortBy { get; init; }

    /// <summary>Sort direction: "asc" or "desc". Defaults to "desc" (newest first) if SortBy is not specified.</summary>
    public string? SortDirection { get; init; }
}
