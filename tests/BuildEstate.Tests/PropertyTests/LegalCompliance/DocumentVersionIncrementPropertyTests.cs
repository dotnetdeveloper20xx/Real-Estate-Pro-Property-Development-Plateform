using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Documents.Commands.UploadDocumentVersion;
using BuildEstate.Application.Features.LegalCompliance.Documents.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for Document Version Increment.
///
/// Property 13: Document Version Increment
/// Generate random version sequences and verify N → N+1 increment with original preserved.
/// When a new version is uploaded, Version should be original.Version + 1,
/// and the original document should remain unchanged.
///
/// **Validates: Requirements 8.4**
/// </summary>
public class DocumentVersionIncrementPropertyTests
{
    /// <summary>
    /// FsCheck generator for valid starting version numbers (1 through 1000).
    /// </summary>
    private static Gen<int> ValidVersionGen =>
        Gen.Choose(1, 1000);

    /// <summary>
    /// FsCheck generator for valid file names.
    /// </summary>
    private static Gen<string> ValidFileNameGen =>
        Gen.Choose(5, 50)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyz0123456789-_".ToCharArray()))
            .Select(chars => new string(chars) + ".pdf"));

    /// <summary>
    /// FsCheck generator for valid content types.
    /// </summary>
    private static Gen<string> ValidContentTypeGen =>
        Gen.Elements("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/png", "image/jpeg", "image/tiff");

    /// <summary>
    /// FsCheck generator for valid file sizes (1 byte to 50MB).
    /// </summary>
    private static Gen<long> ValidFileSizeGen =>
        Gen.Choose(1, 50 * 1024 * 1024).Select(x => (long)x);

    /// <summary>
    /// FsCheck generator for valid storage paths.
    /// </summary>
    private static Gen<string> ValidStoragePathGen =>
        Gen.Choose(5, 30)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyz0123456789/".ToCharArray()))
            .Select(chars => "/documents/" + new string(chars)));

    /// <summary>
    /// FsCheck generator for LegalDocumentType enum values.
    /// </summary>
    private static Gen<LegalDocumentType> ValidDocumentTypeGen =>
        Gen.Elements(Enum.GetValues<LegalDocumentType>());

    /// <summary>
    /// FsCheck generator for ConfidentialityLevel enum values.
    /// </summary>
    private static Gen<ConfidentialityLevel> ValidConfidentialityLevelGen =>
        Gen.Elements(Enum.GetValues<ConfidentialityLevel>());

    /// <summary>
    /// Creates an original LegalDocument entity with the specified starting version.
    /// </summary>
    private static LegalDocument CreateOriginalDocument(
        int startingVersion,
        LegalDocumentType documentType,
        ConfidentialityLevel confidentialityLevel)
    {
        return new LegalDocument
        {
            Id = Guid.NewGuid(),
            DocumentType = documentType,
            ConfidentialityLevel = confidentialityLevel,
            FileName = "original-document.pdf",
            ContentType = "application/pdf",
            FileSize = 1024,
            StoragePath = "/documents/original/path",
            Version = startingVersion,
            UploadedAt = DateTime.UtcNow.AddDays(-10),
            UploadedBy = "original-user",
            LegalCaseId = Guid.NewGuid(),
            ContractId = null,
            RetentionExpiryDate = DateTime.UtcNow.AddYears(7),
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            CreatedBy = "original-user"
        };
    }

    /// <summary>
    /// Creates mocked dependencies and returns the handler, capturing the added entity.
    /// </summary>
    private static (UploadDocumentVersionCommandHandler Handler, LegalDocument OriginalDocument, Mock<IRepository<LegalDocument>> RepoMock)
        CreateHandler(LegalDocument originalDocument)
    {
        var userId = Guid.NewGuid().ToString();

        var repositoryMock = new Mock<IRepository<LegalDocument>>();
        repositoryMock
            .Setup(r => r.GetByIdAsync(originalDocument.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(originalDocument);

        repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<LegalDocument>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(c => c.UserId).Returns(userId);
        currentUserServiceMock.Setup(c => c.UserName).Returns("Test User");

        var mapperMock = new Mock<IMapper>();
        mapperMock
            .Setup(m => m.Map<LegalDocumentDto>(It.IsAny<LegalDocument>()))
            .Returns((LegalDocument entity) => new LegalDocumentDto
            {
                Id = entity.Id,
                DocumentType = entity.DocumentType,
                ConfidentialityLevel = entity.ConfidentialityLevel,
                FileName = entity.FileName,
                ContentType = entity.ContentType,
                FileSize = entity.FileSize,
                StoragePath = entity.StoragePath,
                Version = entity.Version,
                UploadedAt = entity.UploadedAt,
                UploadedBy = entity.UploadedBy,
                RetentionExpiryDate = entity.RetentionExpiryDate,
                LegalCaseId = entity.LegalCaseId,
                ContractId = entity.ContractId,
                CreatedAt = entity.CreatedAt,
                CreatedBy = entity.CreatedBy
            });

        var handler = new UploadDocumentVersionCommandHandler(
            repositoryMock.Object,
            unitOfWorkMock.Object,
            currentUserServiceMock.Object,
            mapperMock.Object);

        return (handler, originalDocument, repositoryMock);
    }

    /// <summary>
    /// Property 13: Document Version Increment — New version is original.Version + 1.
    /// For any starting version N, when a new version is uploaded, the resulting document
    /// SHALL have Version = N + 1.
    ///
    /// **Validates: Requirements 8.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property UploadDocumentVersion_VersionIsIncrementedByOne()
    {
        var gen = from version in ValidVersionGen
                  from fileName in ValidFileNameGen
                  from contentType in ValidContentTypeGen
                  from fileSize in ValidFileSizeGen
                  from storagePath in ValidStoragePathGen
                  from docType in ValidDocumentTypeGen
                  from confLevel in ValidConfidentialityLevelGen
                  select (version, fileName, contentType, fileSize, storagePath, docType, confLevel);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (startingVersion, fileName, contentType, fileSize, storagePath, docType, confLevel) = tuple;

            var originalDocument = CreateOriginalDocument(startingVersion, docType, confLevel);
            var (handler, _, _) = CreateHandler(originalDocument);

            var command = new UploadDocumentVersionCommand
            {
                DocumentId = originalDocument.Id,
                FileName = fileName,
                ContentType = contentType,
                FileSize = fileSize,
                StoragePath = storagePath
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.Version == startingVersion + 1)
                .Label($"Expected Version={startingVersion + 1} but got {result.Version} (original was {startingVersion})");
        });
    }

    /// <summary>
    /// Property 13: Document Version Increment — Original document remains unchanged.
    /// For any starting version N, after uploading a new version, the original document's
    /// Version, FileName, ContentType, FileSize, and StoragePath SHALL remain unchanged.
    ///
    /// **Validates: Requirements 8.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property UploadDocumentVersion_OriginalDocumentRemainsUnchanged()
    {
        var gen = from version in ValidVersionGen
                  from fileName in ValidFileNameGen
                  from contentType in ValidContentTypeGen
                  from fileSize in ValidFileSizeGen
                  from storagePath in ValidStoragePathGen
                  from docType in ValidDocumentTypeGen
                  from confLevel in ValidConfidentialityLevelGen
                  select (version, fileName, contentType, fileSize, storagePath, docType, confLevel);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (startingVersion, fileName, contentType, fileSize, storagePath, docType, confLevel) = tuple;

            var originalDocument = CreateOriginalDocument(startingVersion, docType, confLevel);

            // Capture original state before handler execution
            var originalVersion = originalDocument.Version;
            var originalFileName = originalDocument.FileName;
            var originalContentType = originalDocument.ContentType;
            var originalFileSize = originalDocument.FileSize;
            var originalStoragePath = originalDocument.StoragePath;
            var originalUploadedAt = originalDocument.UploadedAt;
            var originalUploadedBy = originalDocument.UploadedBy;

            var (handler, _, _) = CreateHandler(originalDocument);

            var command = new UploadDocumentVersionCommand
            {
                DocumentId = originalDocument.Id,
                FileName = fileName,
                ContentType = contentType,
                FileSize = fileSize,
                StoragePath = storagePath
            };

            handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            // Verify original document is unchanged
            var versionUnchanged = originalDocument.Version == originalVersion;
            var fileNameUnchanged = originalDocument.FileName == originalFileName;
            var contentTypeUnchanged = originalDocument.ContentType == originalContentType;
            var fileSizeUnchanged = originalDocument.FileSize == originalFileSize;
            var storagePathUnchanged = originalDocument.StoragePath == originalStoragePath;
            var uploadedAtUnchanged = originalDocument.UploadedAt == originalUploadedAt;
            var uploadedByUnchanged = originalDocument.UploadedBy == originalUploadedBy;

            return (versionUnchanged && fileNameUnchanged && contentTypeUnchanged &&
                    fileSizeUnchanged && storagePathUnchanged && uploadedAtUnchanged && uploadedByUnchanged)
                .Label($"Original document was modified: Version={versionUnchanged}, FileName={fileNameUnchanged}, " +
                       $"ContentType={contentTypeUnchanged}, FileSize={fileSizeUnchanged}, " +
                       $"StoragePath={storagePathUnchanged}, UploadedAt={uploadedAtUnchanged}, UploadedBy={uploadedByUnchanged}");
        });
    }

    /// <summary>
    /// Property 13: Document Version Increment — Sequential versions always increment by 1.
    /// For any sequence of version uploads starting from version N, each subsequent upload
    /// SHALL produce version N+1, N+2, N+3, etc.
    ///
    /// **Validates: Requirements 8.4**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property UploadDocumentVersion_SequentialUploadsIncrementConsecutively()
    {
        var gen = from startVersion in ValidVersionGen
                  from sequenceLength in Gen.Choose(2, 5)
                  from docType in ValidDocumentTypeGen
                  from confLevel in ValidConfidentialityLevelGen
                  select (startVersion, sequenceLength, docType, confLevel);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (startVersion, sequenceLength, docType, confLevel) = tuple;

            var currentVersion = startVersion;

            for (int i = 0; i < sequenceLength; i++)
            {
                var document = CreateOriginalDocument(currentVersion, docType, confLevel);
                var (handler, _, _) = CreateHandler(document);

                var command = new UploadDocumentVersionCommand
                {
                    DocumentId = document.Id,
                    FileName = $"version-{currentVersion + 1}.pdf",
                    ContentType = "application/pdf",
                    FileSize = 2048,
                    StoragePath = $"/documents/v{currentVersion + 1}"
                };

                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                if (result.Version != currentVersion + 1)
                {
                    return false.Label(
                        $"At iteration {i}: Expected Version={currentVersion + 1} but got {result.Version}");
                }

                currentVersion = result.Version;
            }

            return (currentVersion == startVersion + sequenceLength)
                .Label($"Expected final version={startVersion + sequenceLength} but got {currentVersion}");
        });
    }
}
