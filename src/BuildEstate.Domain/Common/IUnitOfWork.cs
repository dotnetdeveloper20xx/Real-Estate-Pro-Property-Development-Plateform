namespace BuildEstate.Domain.Common;

/// <summary>
/// Unit of Work interface ensuring all changes within a single operation
/// are saved atomically.
/// </summary>
public interface IUnitOfWork
{
    /// <summary>
    /// Persists all pending changes and returns the number of state entries written.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
