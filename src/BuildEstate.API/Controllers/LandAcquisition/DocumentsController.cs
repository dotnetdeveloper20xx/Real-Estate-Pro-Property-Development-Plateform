using BuildEstate.Application.Features.LandAcquisition.Documents.Commands.DeleteDocument;
using BuildEstate.Application.Features.LandAcquisition.Documents.Commands.UploadDocument;
using BuildEstate.Application.Features.LandAcquisition.Documents.Queries.DownloadDocument;
using BuildEstate.Application.Features.LandAcquisition.Documents.Queries.GetDocumentsByOpportunity;
using BuildEstate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages documents associated with land opportunities.
/// Supports listing, uploading, downloading, and deleting documents.
/// </summary>
[Route("api/v1/opportunities/{opportunityId:guid}/documents")]
public class DocumentsController : BaseApiController
{
    /// <summary>
    /// Lists all documents for a given opportunity with optional DocType filter.
    /// Accessible by all authenticated users.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetByOpportunity(
        [FromRoute] Guid opportunityId,
        [FromQuery] DocumentType? docType,
        CancellationToken cancellationToken)
    {
        var query = new GetDocumentsByOpportunityQuery
        {
            OpportunityId = opportunityId,
            DocType = docType
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Uploads a document for the specified opportunity.
    /// Accepts multipart form data with file and DocType.
    /// Accessible by all authenticated users.
    /// </summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromRoute] Guid opportunityId,
        [FromForm] IFormFile file,
        [FromForm] DocumentType docType,
        CancellationToken cancellationToken)
    {
        var command = new UploadDocumentCommand
        {
            OpportunityId = opportunityId,
            DocType = docType,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            FileContent = file.OpenReadStream()
        };

        var result = await Mediator.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetByOpportunity), new { opportunityId }, result);
    }

    /// <summary>
    /// Downloads a specific document by its ID.
    /// Returns the file with correct content type header.
    /// Accessible by all authenticated users.
    /// </summary>
    [HttpGet("{docId:guid}/download")]
    public async Task<IActionResult> Download(
        [FromRoute] Guid opportunityId,
        [FromRoute] Guid docId,
        CancellationToken cancellationToken)
    {
        var query = new DownloadDocumentQuery
        {
            DocumentId = docId
        };

        var result = await Mediator.Send(query, cancellationToken);

        return File(result.FileStream, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Deletes (soft-deletes) a document. Restricted to Admin role.
    /// Records the deletion in the audit trail.
    /// </summary>
    [HttpDelete("{docId:guid}")]
    [Authorize(Policy = "opportunities.delete")]
    public async Task<IActionResult> Delete(
        [FromRoute] Guid opportunityId,
        [FromRoute] Guid docId,
        CancellationToken cancellationToken)
    {
        var command = new DeleteDocumentCommand
        {
            DocumentId = docId
        };

        await Mediator.Send(command, cancellationToken);

        return NoContent();
    }
}
