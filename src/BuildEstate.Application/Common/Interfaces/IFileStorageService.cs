namespace BuildEstate.Application.Common.Interfaces;

/// <summary>
/// Provides file storage operations for uploading, downloading, and deleting files.
/// Implementations may use local disk, Azure Blob Storage, or other storage backends.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file to the storage backend.
    /// </summary>
    /// <param name="content">The file content stream to upload.</param>
    /// <param name="fileName">The original file name including extension.</param>
    /// <param name="contentType">The MIME content type of the file (e.g., application/pdf).</param>
    /// <param name="ct">Cancellation token for async operation.</param>
    /// <returns>The storage path or URI of the uploaded file.</returns>
    Task<string> UploadAsync(Stream content, string fileName, string contentType, CancellationToken ct);

    /// <summary>
    /// Downloads a file from the storage backend.
    /// </summary>
    /// <param name="filePath">The storage path or URI of the file to download.</param>
    /// <param name="ct">Cancellation token for async operation.</param>
    /// <returns>A stream containing the file content.</returns>
    Task<Stream> DownloadAsync(string filePath, CancellationToken ct);

    /// <summary>
    /// Deletes a file from the storage backend.
    /// </summary>
    /// <param name="filePath">The storage path or URI of the file to delete.</param>
    /// <param name="ct">Cancellation token for async operation.</param>
    Task DeleteAsync(string filePath, CancellationToken ct);
}
