using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.CreateFee;

/// <summary>
/// Command to create a new planning fee against a planning application.
/// When Amount exceeds the configured threshold, a FeeRequiresApprovalDomainEvent is raised.
/// </summary>
public sealed record CreateFeeCommand : IRequest<FeeDto>
{
    public Guid ApplicationId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = string.Empty;
    public FeeType FeeType { get; init; }
    public string Description { get; init; } = string.Empty;
}
