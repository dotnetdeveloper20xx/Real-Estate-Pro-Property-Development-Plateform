using BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.CreateAppeal;

/// <summary>
/// Command to create a new planning appeal for a refused application.
/// </summary>
public sealed record CreateAppealCommand : IRequest<AppealDto>
{
    public Guid ApplicationId { get; init; }
    public string AppealGrounds { get; init; } = string.Empty;
    public AppealType AppealType { get; init; }
}
