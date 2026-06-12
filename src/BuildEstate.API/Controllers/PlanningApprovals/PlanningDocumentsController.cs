using BuildEstate.Application.Features.PlanningApprovals.Documents.Commands.DeleteDocument;
using BuildEstate.Application.Features.PlanningApprovals.Documents.Commands.UploadDocument;
using BuildEstate.Application.Features.PlanningApprovals.Documents.Queries.DownloadDocument;
using BuildEstate.Application.Features.PlanningApprovals.Documents.Queries.GetDocuments;
using BuildEstate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.PlanningApprovals;

/// <summary>
/// Manages planning documents associated with planning applications.
/// Supports listing, uploading, downloading, and soft-deleting documents.
/// Upload and delete operations are restricted to Admin_Support and Planning_Manager roles.
/// </summary>
[Route("api/v1/planning-applications/{applicationId:guid}/documents")]
public class PlanningDocumentsController : BaseApiController
{
    /// <summary>
    /// Returns a paginated list of planning documents for the specified application.
    /// Supports optional filtering by DocumentType.
    /// Accessible by all authenticated users with planning roles.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByApplication(
        [FromRoute] Guid applicationId,
        [FromQuery] PlanningDocumentType? documentType,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetDocumentsQuery
        {
            ApplicationId = applicationId,
            DocumentType = documentType,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Uploads a document for the specified planning application.
    /// Accepts multipart form data with file and DocumentType.
    /// Validates file size (max 50MB) and allowed content types (PDF, DOCX, XLSX, PNG, JPG, DWG, DXF).
    /// Restricted to Admin_Support and Planning_Manager roles.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "AdminSupport,PlanningManager")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(
        [FromRoute] Guid applicationId,
        [FromForm] IFormFile file,
        [FromForm] PlanningDocumentType documentType,
        CancellationToken cancellationToken)
    {
        var command = new UploadDocumentCommand
        {
            ApplicationId = applicationId,
            DocumentType = documentType,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            FileContent = file.OpenReadStream()
        };

        var result = await Mediator.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetByApplication), new { applicationId }, result);
    }

    /// <summary>
    /// Downloads a specific planning document by its ID.
    /// Returns the file content with the correct Content-Type header.
    /// Accessible by all authenticated users with planning roles.
    /// </summary>
    [HttpGet("/api/v1/planning-documents/{documentId:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(
        [FromRoute] Guid documentId,
        CancellationToken cancellationToken)
    {
        var query = new DownloadDocumentQuery
        {
            DocumentId = documentId
        };

        var result = await Mediator.Send(query, cancellationToken);

        return File(result.FileStream, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Soft-deletes a planning document by its ID.
    /// Records the deletion in the audit trail via the AuditInterceptor.
    /// Restricted to Admin_Support and Planning_Manager roles.
    /// </summary>
    [HttpDelete("/api/v1/planning-documents/{documentId:guid}")]
    [Authorize(Roles = "AdminSupport,PlanningManager")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        [FromRoute] Guid documentId,
        CancellationToken cancellationToken)
    {
        var command = new DeleteDocumentCommand
        {
            DocumentId = documentId
        };

        await Mediator.Send(command, cancellationToken);

        return NoContent();
    }
}
