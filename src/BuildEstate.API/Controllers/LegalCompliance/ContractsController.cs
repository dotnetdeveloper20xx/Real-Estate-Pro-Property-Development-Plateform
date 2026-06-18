using BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.CreateContract;
using BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.TransitionContractStatus;
using BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.UpdateContract;
using BuildEstate.Application.Features.LegalCompliance.Contracts.Queries.GetContractById;
using BuildEstate.Application.Features.LegalCompliance.Contracts.Queries.GetContractRegister;
using BuildEstate.Application.Features.LegalCompliance.Contracts.Queries.GetContracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Manages legal contract lifecycle operations including creation, updates,
/// status transitions, and register views. All endpoints require authentication.
/// Write operations are restricted to Legal_Compliance_Officer; status transitions
/// also permit Finance_Director. Read operations are available to all legal roles.
/// </summary>
[Route("api/v1/contracts")]
public class ContractsController : BaseApiController
{
    /// <summary>
    /// Creates a new contract linked to an existing legal case.
    /// The contract is initialised with status Draft and a unique reference (CON-YYYY-NNNNN).
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "legal.create")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        [FromBody] CreateContractCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Returns a paginated, filtered, and sorted list of contracts.
    /// Supports filtering by Status, ContractType, LegalCaseId, and free-text search
    /// across Title, ContractReference, and CounterpartyName.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "legal.read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetContractsQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns the full contract detail including related documents,
    /// linked legal case reference, and permitted status transitions.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "legal.read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetContractByIdQuery { Id = id },
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Updates an existing contract's editable fields.
    /// Only non-null fields in the command body are applied (partial update).
    /// Uses optimistic concurrency via RowVersion.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "legal.update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateContractCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Transitions a contract to a new status, enforcing state machine rules.
    /// Conditional data required for specific transitions:
    /// - ExecutionDate + SignatoryNames for Executed
    /// - TerminationReason + TerminationDate for Terminated
    /// - ApprovalNotes for Approved
    /// Finance_Director approval required for high-value contracts.
    /// </summary>
    [HttpPost("{id:guid}/transition")]
    [Authorize(Policy = "legal.approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        Guid id,
        [FromBody] TransitionContractStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns a paginated contract register view formatted for the register data table.
    /// Supports the same filters as the list endpoint but returns ContractRegisterDto
    /// with additional summary fields for the dedicated register view.
    /// </summary>
    [HttpGet("register")]
    [Authorize(Policy = "legal.read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRegister(
        [FromQuery] GetContractRegisterQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}
