using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.CreateCondition;

/// <summary>
/// Command to create a new planning condition against an approved-with-conditions application.
/// </summary>
public sealed record CreateConditionCommand : IRequest<ConditionDto>
{
    public Guid ApplicationId { get; init; }
    public int ConditionNumber { get; init; }
    public string Description { get; init; } = string.Empty;
    public ConditionType ConditionType { get; init; }
}
