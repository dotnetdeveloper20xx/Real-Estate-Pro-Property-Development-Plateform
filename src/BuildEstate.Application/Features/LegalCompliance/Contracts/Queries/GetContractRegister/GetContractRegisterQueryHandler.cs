using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Queries.GetContractRegister;

/// <summary>
/// Handles retrieval of the contract register — a paginated, filterable, sortable view
/// of contracts formatted for the register data table (Requirement 14.3).
/// Uses AsNoTracking for optimised read-only queries and projects directly to ContractRegisterDto.
/// Includes LegalCase navigation for the case reference field.
/// </summary>
public sealed class GetContractRegisterQueryHandler
    : IRequestHandler<GetContractRegisterQuery, PagedResult<ContractRegisterDto>>
{
    private readonly IRepository<Contract> _repository;

    public GetContractRegisterQueryHandler(IRepository<Contract> repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<ContractRegisterDto>> Handle(
        GetContractRegisterQuery request,
        CancellationToken cancellationToken)
    {
        IQueryable<Contract> query = _repository.Query()
            .AsNoTracking()
            .Include(c => c.LegalCase);

        // Apply filters
        query = ApplyFilters(query, request);

        // Apply free-text search
        query = ApplySearch(query, request.SearchTerm);

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = ApplySorting(query, request.SortBy, request.SortDirection);

        // Apply pagination
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ContractRegisterDto
            {
                Id = c.Id,
                ContractReference = c.ContractReference,
                Title = c.Title,
                ContractType = c.ContractType.ToString(),
                Status = c.Status.ToString(),
                CounterpartyName = c.CounterpartyName,
                ContractValue = c.ContractValue,
                Currency = c.Currency,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                LegalCaseReference = c.LegalCase != null ? c.LegalCase.CaseReference : null
            })
            .ToListAsync(cancellationToken);

        return PagedResult<ContractRegisterDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    private static IQueryable<Contract> ApplyFilters(
        IQueryable<Contract> query,
        GetContractRegisterQuery request)
    {
        if (request.Status.HasValue)
        {
            query = query.Where(c => c.Status == request.Status.Value);
        }

        if (request.ContractType.HasValue)
        {
            query = query.Where(c => c.ContractType == request.ContractType.Value);
        }

        if (request.LegalCaseId.HasValue)
        {
            query = query.Where(c => c.LegalCaseId == request.LegalCaseId.Value);
        }

        return query;
    }

    private static IQueryable<Contract> ApplySearch(
        IQueryable<Contract> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        var term = searchTerm.Trim();

        return query.Where(c =>
            c.Title.Contains(term) ||
            c.ContractReference.Contains(term) ||
            c.CounterpartyName.Contains(term));
    }

    private static IQueryable<Contract> ApplySorting(
        IQueryable<Contract> query,
        string? sortBy,
        string? sortDirection)
    {
        var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy?.ToLowerInvariant() switch
        {
            "title" => isDescending
                ? query.OrderByDescending(c => c.Title)
                : query.OrderBy(c => c.Title),

            "contractreference" => isDescending
                ? query.OrderByDescending(c => c.ContractReference)
                : query.OrderBy(c => c.ContractReference),

            "createdat" => isDescending
                ? query.OrderByDescending(c => c.CreatedAt)
                : query.OrderBy(c => c.CreatedAt),

            "status" => isDescending
                ? query.OrderByDescending(c => c.Status)
                : query.OrderBy(c => c.Status),

            "contracttype" => isDescending
                ? query.OrderByDescending(c => c.ContractType)
                : query.OrderBy(c => c.ContractType),

            "contractvalue" => isDescending
                ? query.OrderByDescending(c => c.ContractValue)
                : query.OrderBy(c => c.ContractValue),

            "startdate" => isDescending
                ? query.OrderByDescending(c => c.StartDate)
                : query.OrderBy(c => c.StartDate),

            "enddate" => isDescending
                ? query.OrderByDescending(c => c.EndDate)
                : query.OrderBy(c => c.EndDate),

            _ => query.OrderByDescending(c => c.CreatedAt) // Default sort: newest first
        };
    }
}
