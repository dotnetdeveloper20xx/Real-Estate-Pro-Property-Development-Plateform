using BuildEstate.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly ILogger<FileStorageService> _logger;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _basePath = configuration["FileStorage:BasePath"] ?? "Storage";
        _logger = logger;
    }

    public async Task<string> UploadAsync(Stream content, string fileName, string contentType, CancellationToken ct)
    {
        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var relativePath = Path.Combine("Documents", uniqueFileName);
        var fullPath = Path.Combine(_basePath, relativePath);

        var directory = Path.GetDirectoryName(fullPath)!;
        if (!Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
        await content.CopyToAsync(fileStream, ct);

        _logger.LogInformation(
            "File uploaded: {FileName} stored as {StoredPath} ({ContentType})",
            fileName, relativePath, contentType);

        return relativePath;
    }

    public Task<Stream> DownloadAsync(string filePath, CancellationToken ct)
    {
        var fullPath = Path.Combine(_basePath, filePath);

        if (!File.Exists(fullPath))
        {
            _logger.LogWarning("File not found for download: {FilePath}", filePath);
            throw new FileNotFoundException($"The file '{filePath}' was not found in storage.", filePath);
        }

        _logger.LogInformation("File downloaded: {FilePath}", filePath);

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string filePath, CancellationToken ct)
    {
        var fullPath = Path.Combine(_basePath, filePath);

        if (!File.Exists(fullPath))
        {
            _logger.LogWarning("File not found for deletion: {FilePath}", filePath);
            return Task.CompletedTask;
        }

        File.Delete(fullPath);

        _logger.LogInformation("File deleted: {FilePath}", filePath);

        return Task.CompletedTask;
    }
}
