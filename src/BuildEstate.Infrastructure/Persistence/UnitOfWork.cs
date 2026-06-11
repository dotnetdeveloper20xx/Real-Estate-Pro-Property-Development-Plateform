using BuildEstate.Domain.Common;

namespace BuildEstate.Infrastructure.Persistence;

/// <summary>
/// Unit of Work implementation that delegates persistence to the underlying DbContext.
/// Ensures all changes within a single operation are saved atomically.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly BuildEstateDbContext _context;

    public UnitOfWork(BuildEstateDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
