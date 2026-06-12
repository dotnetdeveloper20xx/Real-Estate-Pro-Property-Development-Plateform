namespace BuildEstate.Domain.Services;

/// <summary>
/// Generates unique reference numbers for legal cases and contracts.
/// Reference formats: LC-YYYY-NNNNN for legal cases, CON-YYYY-NNNNN for contracts.
/// Implementations must ensure atomicity and prevent duplicate sequences under concurrency.
/// </summary>
public interface ILegalReferenceNumberGenerator
{
    /// <summary>
    /// Generates a unique legal case reference in the format LC-YYYY-NNNNN.
    /// The sequence resets to 1 at the start of each UTC year.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token for async operation.</param>
    /// <returns>A unique case reference string.</returns>
    Task<string> GenerateCaseReferenceAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a unique contract reference in the format CON-YYYY-NNNNN.
    /// The sequence resets to 1 at the start of each UTC year.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token for async operation.</param>
    /// <returns>A unique contract reference string.</returns>
    Task<string> GenerateContractReferenceAsync(CancellationToken cancellationToken = default);
}
