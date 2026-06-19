using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.DeleteLandOwner;

/// <summary>
/// Command to soft-delete a land owner by setting IsDeleted=true.
/// </summary>
public sealed record DeleteLandOwnerCommand : IRequest<Unit>
{
    public Guid Id { get; init; }
    public Guid OpportunityId { get; init; }
}
