using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace BuildEstate.Tests.Helpers;

/// <summary>
/// In-memory IQueryable that supports async enumeration for use in unit tests
/// where EF Core's async query methods would otherwise fail.
/// </summary>
public class TestAsyncQueryable<T> : IQueryable<T>, IAsyncEnumerable<T>, IOrderedQueryable<T>
{
    private readonly IQueryable<T> _inner;

    public TestAsyncQueryable(IEnumerable<T> source)
    {
        _inner = source.AsQueryable();
    }

    public TestAsyncQueryable(IQueryable<T> inner)
    {
        _inner = inner;
    }

    public Type ElementType => _inner.ElementType;
    public Expression Expression => _inner.Expression;
    public IQueryProvider Provider => new TestAsyncQueryProvider<T>(_inner.Provider);

    public IEnumerator<T> GetEnumerator() => _inner.GetEnumerator();
    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => _inner.GetEnumerator();

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
        => new TestAsyncEnumerator<T>(_inner.GetEnumerator());
}

internal class TestAsyncQueryProvider<T> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    public TestAsyncQueryProvider(IQueryProvider inner) => _inner = inner;

    public IQueryable CreateQuery(Expression expression)
        => new TestAsyncQueryable<T>(_inner.CreateQuery<T>(expression));

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        => new TestAsyncQueryable<TElement>(_inner.CreateQuery<TElement>(expression));

    public object? Execute(Expression expression) => _inner.Execute(expression);
    public TResult Execute<TResult>(Expression expression) => _inner.Execute<TResult>(expression);

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var resultType = typeof(TResult).GetGenericArguments().FirstOrDefault() ?? typeof(TResult);
        var executeMethod = typeof(IQueryProvider)
            .GetMethod(nameof(IQueryProvider.Execute), 1, new[] { typeof(Expression) })!
            .MakeGenericMethod(resultType);

        var result = executeMethod.Invoke(_inner, new object[] { expression });

        // Handle Task<T> wrapping
        if (typeof(TResult).IsGenericType && typeof(TResult).GetGenericTypeDefinition() == typeof(Task<>))
        {
            var fromResultMethod = typeof(Task)
                .GetMethod(nameof(Task.FromResult))!
                .MakeGenericMethod(resultType);
            return (TResult)fromResultMethod.Invoke(null, new[] { result })!;
        }

        return (TResult)result!;
    }
}

internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public TestAsyncEnumerator(IEnumerator<T> inner) => _inner = inner;

    public T Current => _inner.Current;

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }

    public ValueTask<bool> MoveNextAsync() => new(_inner.MoveNext());
}

/// <summary>
/// Extension methods for creating async-compatible queryables in tests.
/// </summary>
public static class AsyncQueryableExtensions
{
    public static IQueryable<T> AsAsyncQueryable<T>(this IEnumerable<T> source)
        => new TestAsyncQueryable<T>(source);
}
