using BuildEstate.Domain.Services;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services.LegalCompliance;

/// <summary>
/// Generates unique reference numbers for legal cases (LC-YYYY-NNNNN) and contracts (CON-YYYY-NNNNN).
/// Uses a serializable transaction to prevent duplicate sequences under concurrency.
/// The sequence resets to 1 at the start of each UTC year.
/// </summary>
public class LegalReferenceNumberGenerator : ILegalReferenceNumberGenerator
{
    private readonly BuildEstateDbContext _dbContext;
    private readonly ILogger<LegalReferenceNumberGenerator> _logger;

    public LegalReferenceNumberGenerator(
        BuildEstateDbContext dbContext,
        ILogger<LegalReferenceNumberGenerator> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<string> GenerateCaseReferenceAsync(CancellationToken cancellationToken = default)
    {
        var currentYear = DateTime.UtcNow.Year;
        var prefix = $"LC-{currentYear:D4}-";

        var nextSequence = await GetNextSequenceAsync(
            prefix,
            "LegalCases",
            "CaseReference",
            cancellationToken);

        var reference = $"LC-{currentYear:D4}-{nextSequence:D5}";

        _logger.LogInformation(
            "Generated legal case reference {CaseReference} for year {Year}",
            reference, currentYear);

        return reference;
    }

    /// <inheritdoc />
    public async Task<string> GenerateContractReferenceAsync(CancellationToken cancellationToken = default)
    {
        var currentYear = DateTime.UtcNow.Year;
        var prefix = $"CON-{currentYear:D4}-";

        var nextSequence = await GetNextSequenceAsync(
            prefix,
            "Contracts_Legal",
            "ContractReference",
            cancellationToken);

        var reference = $"CON-{currentYear:D4}-{nextSequence:D5}";

        _logger.LogInformation(
            "Generated contract reference {ContractReference} for year {Year}",
            reference, currentYear);

        return reference;
    }

    /// <summary>
    /// Retrieves the next sequence number for a given prefix using a serializable transaction
    /// to prevent race conditions and ensure no duplicates under concurrency.
    /// </summary>
    private async Task<int> GetNextSequenceAsync(
        string prefix,
        string tableName,
        string columnName,
        CancellationToken cancellationToken)
    {
        // Use a serializable transaction to ensure atomic read-increment
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async (ct) =>
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable,
                ct);

            try
            {
                // Use raw SQL with UPDLOCK hint to get the max sequence for this prefix
                // This prevents other transactions from reading the same max until we commit
                var maxReference = await _dbContext.Database
                    .SqlQueryRaw<string>(
                        $"SELECT TOP 1 [{columnName}] FROM [{tableName}] WITH (UPDLOCK, HOLDLOCK) " +
                        $"WHERE [{columnName}] LIKE {{0}} " +
                        $"ORDER BY [{columnName}] DESC",
                        prefix + "%")
                    .FirstOrDefaultAsync(ct);

                var nextSequence = 1;

                if (maxReference is not null)
                {
                    // Extract the numeric part after the last dash
                    var lastDashIndex = maxReference.LastIndexOf('-');
                    if (lastDashIndex >= 0 && lastDashIndex < maxReference.Length - 1)
                    {
                        var numericPart = maxReference[(lastDashIndex + 1)..];
                        if (int.TryParse(numericPart, out var currentMax))
                        {
                            nextSequence = currentMax + 1;
                        }
                    }
                }

                await transaction.CommitAsync(ct);

                return nextSequence;
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }, cancellationToken);
    }
}
