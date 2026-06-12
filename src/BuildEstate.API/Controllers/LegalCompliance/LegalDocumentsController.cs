using BuildEstate.Application.Features.LegalCompliance.Documents.Commands.DeleteLegalDocument;
using BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadDocumentVersion;
using BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadLegalDocument;
using BuildEstate.Application.Features.LegalCompliance.Documents.Queries.GetDocumentsForCase;
using BuildEstate.Application.Features.LegalCompliance.Documents.Queries.GetDocumentsForContract;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Manages legal document operations including upload, listing, versioning, and soft-delete.
/// All endpoints require authentication. Upload and versioning are available to all legal roles.
/// Delete is restricted to Legal_Compliance_Officer only.
/// Documents with ConfidentialityLevel = Restricted are filtered to Legal_Compliance_Officer only
/// in the query handlers.
/// </summary>
[Route("api/v1/legal-documents")]
public class LegalDocumentsController : BaseApiController
{
    /// <summary>
    /// Uploads a new legal document linked to a legal case or contract.
    /// The document is initialised with Version = 1 and UploadedAt set to UTC now.
    /// Validates file size (max 50 MB) and allowed content types (PDF, DOCX, XLSX, PNG, JPG, TIFF).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(
        [FromBody] UploadLegalDocumentCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetForCase), new { caseId = result.LegalCaseId }, result);
    }

    /// <summary>
    /// Returns a paginated, filtered list of legal documents for a specific legal case.
    /// Supports filtering by DocumentType, ConfidentialityLevel, and upload date range.
    /// Documents with ConfidentialityLevel = Restricted are excluded unless the user has
    /// the Legal_Compliance_Officer role.
    /// </summary>
    [HttpGet("case/{caseId:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetForCase(
        Guid caseId,
        [FromQuery] GetDocumentsForCaseQuery query,
        CancellationToken cancellationToken)
    {
        var enrichedQuery = query with { LegalCaseId = caseId };
        var result = await Mediator.Send(enrichedQuery, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns a paginated, filtered list of legal documents for a specific contract.
    /// Supports filtering by DocumentType, ConfidentialityLevel, and upload date range.
    /// Documents with ConfidentialityLevel = Restricted are excluded unless the user has
    /// the Legal_Compliance_Officer role.
    /// </summary>
    [HttpGet("contract/{contractId:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetForContract(
        Guid contractId,
        [FromQuery] GetDocumentsForContractQuery query,
        CancellationToken cancellationToken)
    {
        var enrichedQuery = query with { ContractId = contractId };
        var result = await Mediator.Send(enrichedQuery, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Uploads a new version of an existing legal document.
    /// Increments the version number and retains all previous versions.
    /// Records the upload in the audit trail.
    /// </summary>
    [HttpPost("{id:guid}/version")]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadVersion(
        Guid id,
        [FromBody] UploadDocumentVersionCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.DocumentId)
            return BadRequest("Route id does not match command document id.");

        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetForCase), new { caseId = result.LegalCaseId }, result);
    }

    /// <summary>
    /// Soft-deletes a legal document. Restricted to Legal_Compliance_Officer role.
    /// Records the deletion in the audit trail with user identity and timestamp.
    /// The document remains in the database with IsDeleted = true and is excluded
    /// from all subsequent queries via the global query filter.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new DeleteLegalDocumentCommand { Id = id }, cancellationToken);
        return NoContent();
    }
}
