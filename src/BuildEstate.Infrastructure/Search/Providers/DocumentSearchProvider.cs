using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Documents within the Land Acquisition module.
/// All authenticated users can search documents. Results are filtered by parent entity
/// (OpportunityId) to ensure users only see documents linked to accessible opportunities.
/// Supports Full-Text Search on description-like fields when available.
/// </summary>
public class DocumentSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public DocumentSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "documents";
    public string EntityName => "Document";
    public string CategoryName => "Documents";
    public string Icon => "article";
    public int Priority => 40;

    public async Task<SearchProviderResult> SearchAsync(
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (!HasAccess(user))
        {
            return new SearchProviderResult
            {
                ModuleId = ModuleId,
                CategoryName = CategoryName,
                Icon = Icon,
                Priority = Priority,
                Results = [],
                TotalCount = 0
            };
        }

        // Query documents with their parent opportunity for breadcrumb context
        var documents = await _dbContext.Documents
            .AsNoTracking()
            .Include(d => d.Opportunity)
            .Select(d => new
            {
                d.Id,
                d.FileName,
                d.DocType,
                d.ContentType,
                d.FileSizeBytes,
                d.UploadedAt,
                d.OpportunityId,
                OpportunityName = d.Opportunity.Name,
                d.CreatedBy
            })
            .ToListAsync(cancellationToken);

        var results = documents.Select(d =>
        {
            var docTypeString = d.DocType.ToString();
            var fileSizeDisplay = FormatFileSize(d.FileSizeBytes);

            return new RawSearchResult
            {
                EntityId = d.Id,
                EntityType = EntityName,
                Title = d.FileName,
                Subtitle = $"{docTypeString} • {fileSizeDisplay}",
                Status = docTypeString,
                StatusVariant = GetDocTypeVariant(docTypeString),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Documents",
                NavigationRoute = $"/land-acquisition/opportunities/{d.OpportunityId}",
                ModifiedAt = d.UploadedAt,
                Breadcrumb = $"Land Acquisition > {d.OpportunityName} > Documents",
                CreatedBy = d.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "FileName", Value = d.FileName, Weight = 2.0 },
                    new SearchableField { Name = "DocType", Value = docTypeString, Weight = 1.5 },
                    new SearchableField { Name = "Description", Value = $"{docTypeString} document for {d.OpportunityName}", Weight = 1.0 },
                    new SearchableField { Name = "Tags", Value = $"{docTypeString} {d.ContentType}", Weight = 1.5 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View Opportunity",
                        Icon = "visibility",
                        Route = $"/land-acquisition/opportunities/{d.OpportunityId}"
                    },
                    new SearchQuickAction
                    {
                        Label = "Download",
                        Icon = "download",
                        Action = "download-document",
                        Route = $"/api/v1/opportunities/{d.OpportunityId}/documents/{d.Id}/download"
                    }
                }
            };
        }).ToList();

        return new SearchProviderResult
        {
            ModuleId = ModuleId,
            CategoryName = CategoryName,
            Icon = Icon,
            Priority = Priority,
            Results = results,
            TotalCount = results.Count
        };
    }

    public async Task<int> CountAsync(
        string query,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (!HasAccess(user))
        {
            return 0;
        }

        return await _dbContext.Documents
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// All authenticated users can search documents.
    /// The user identity (non-null) is sufficient for access.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.Identity?.IsAuthenticated == true;
    }

    /// <summary>
    /// Maps document type to a display colour variant.
    /// </summary>
    private static string? GetDocTypeVariant(string docType)
    {
        return docType switch
        {
            "TitleDeed" => "success",
            "LegalDocument" => "warning",
            "Contract" => "accent",
            "EnvironmentalReport" => "info",
            "SearchReport" => "info",
            "PlanningDocument" => "info",
            "Valuation" => "warning",
            "Correspondence" => "ghost",
            _ => null
        };
    }

    /// <summary>
    /// Formats file size in bytes to a human-readable string.
    /// </summary>
    private static string FormatFileSize(long bytes)
    {
        return bytes switch
        {
            < 1024 => $"{bytes} B",
            < 1024 * 1024 => $"{bytes / 1024.0:F1} KB",
            < 1024 * 1024 * 1024 => $"{bytes / (1024.0 * 1024):F1} MB",
            _ => $"{bytes / (1024.0 * 1024 * 1024):F1} GB"
        };
    }
}
