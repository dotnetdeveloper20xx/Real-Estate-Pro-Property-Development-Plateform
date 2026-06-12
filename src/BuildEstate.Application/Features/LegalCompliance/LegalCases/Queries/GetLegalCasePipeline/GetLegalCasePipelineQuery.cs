using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCasePipeline;

/// <summary>
/// Query to retrieve all non-deleted legal cases grouped by their current status
/// for a pipeline/kanban board view. Each group includes its case items and count.
/// </summary>
public sealed record GetLegalCasePipelineQuery : IRequest<List<LegalCasePipelineDto>>;
