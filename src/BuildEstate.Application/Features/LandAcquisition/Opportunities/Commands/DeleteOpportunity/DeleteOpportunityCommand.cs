using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.DeleteOpportunity;

/// <summary>
/// Command to soft-delete a land opportunity by setting IsDeleted=true.
/// </summary>
public sealed record DeleteOpportunityCommand(Guid Id) : IRequest<Unit>;
