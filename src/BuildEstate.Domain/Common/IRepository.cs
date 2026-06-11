namespace BuildEstate.Domain.Common;

/// <summary>
/// Generic repository interface providing standard data access operations.
/// Decoupled from any persistence technology.
/// </summary>
/// <typeparam name="T">Entity type constrained to BaseEntity.</typeparam>
public interface IRepository<T> where T : BaseEntity
{
    /// <summary>
    /// Retrieves an entity by its unique identifier.
    /// Returns null if no matching entity is found.
    /// </summary>
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves all entities of the specified type.
    /// </summary>
    Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns a queryable for composing additional filtering, sorting, and projection.
    /// </summary>
    IQueryable<T> Query();

    /// <summary>
    /// Adds a new entity for insertion on the next save operation.
    /// </summary>
    Task AddAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks an entity as modified for persistence on the next save operation.
    /// </summary>
    void Update(T entity);

    /// <summary>
    /// Marks an entity for deletion on the next save operation.
    /// </summary>
    void Delete(T entity);
}
