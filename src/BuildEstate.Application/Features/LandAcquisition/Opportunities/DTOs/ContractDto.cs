// Contract DTO has been moved to the Contracts feature folder.
// This file provides a type alias for backward compatibility.
// See: BuildEstate.Application.Features.LandAcquisition.Contracts.DTOs.ContractDto

using ContractDtoFull = BuildEstate.Application.Features.LandAcquisition.Contracts.DTOs.ContractDto;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

/// <summary>
/// Backward-compatible placeholder — use the full ContractDto from the Contracts feature.
/// Retained to avoid breaking any existing references during transition.
/// </summary>
public sealed record ContractDto(Guid Id);
