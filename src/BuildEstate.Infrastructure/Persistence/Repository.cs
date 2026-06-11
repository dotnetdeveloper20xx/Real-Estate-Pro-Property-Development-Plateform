using BuildEstate.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Persistence;

/// <summary>
/// Generic repository implementation providing standard CRUD operations
/// for all entities inheriting from BaseEntity using EF Core DbSet operations.
/// </summary>
/// <typeparam name="T">Entity type constrained to BaseEntity.</typeparam>
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    private readonly BuildEstateDbContext _context;

    public Repository(BuildEstateDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<T>()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<T>()
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public IQueryable<T> Query()
    {
        return _context.Set<T>().AsQueryable();
    }

    /// <inheritdoc />
    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _context.Set<T>().AddAsync(entity, cancellationToken);
    }

    /// <inheritdoc />
    public void Update(T entity)
    {
        _context.Set<T>().Update(entity);
    }

    /// <inheritdoc />
    public void Delete(T entity)
    {
        _context.Set<T>().Remove(entity);
    }
}
