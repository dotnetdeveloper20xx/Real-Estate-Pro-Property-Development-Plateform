using Microsoft.EntityFrameworkCore.Query;
using System.Collections;
using System.Linq.Expressions;

namespace BuildEstate.Tests;

/// <summary>
/// In-memory IQueryable implementation that supports EF Core async operations
/// (FirstOrDefaultAsync, ToListAsync, etc.) and silently ignores Include/ThenInclude calls.
/// Used in property-based tests to avoid needing a real DbContext.
/// </summary>
public class TestAsyncQueryable<T> : IQueryable<T>, IAsyncEnumerable<T>, IOrderedQueryable<T>
{
    private readonly IQueryable<T> _inner;

    public TestAsyncQueryable(IEnumerable<T> data)
    {
        _inner = data.AsQueryable();
        Provider = new TestAsyncQueryProvider<T>(_inner.Provider);
        Expression = _inner.Expression;
        ElementType = _inner.ElementType;
    }

    private TestAsyncQueryable(IQueryable<T> inner)
    {
        _inner = inner;
        Provider = new TestAsyncQueryProvider<T>(_inner.Provider);
        Expression = _inner.Expression;
        ElementType = _inner.ElementType;
    }

    public IQueryProvider Provider { get; }
    public Expression Expression { get; }
    public Type ElementType { get; }

    public IEnumerator<T> GetEnumerator() => _inner.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        return new TestAsyncEnumerator<T>(_inner.GetEnumerator());
    }
}

internal class TestAsyncQueryProvider<T> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    public TestAsyncQueryProvider(IQueryProvider inner)
    {
        _inner = inner;
    }

    public IQueryable CreateQuery(Expression expression)
    {
        return new TestAsyncQueryable<T>((IQueryable<T>)_inner.CreateQuery<T>(expression));
    }

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        return new TestAsyncQueryable<TElement>(
            _inner.CreateQuery<TElement>(expression).AsEnumerable());
    }

    public object? Execute(Expression expression)
    {
        return _inner.Execute(expression);
    }

    public TResult Execute<TResult>(Expression expression)
    {
        return _inner.Execute<TResult>(expression);
    }

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var resultType = typeof(TResult);

        // Handle Task<T> and ValueTask<T>
        if (resultType.IsGenericType)
        {
            var genericDef = resultType.GetGenericTypeDefinition();

            if (genericDef == typeof(Task<>))
            {
                var innerType = resultType.GetGenericArguments()[0];
                var result = Execute(expression, innerType);
                var fromResultMethod = typeof(Task).GetMethod(nameof(Task.FromResult))!
                    .MakeGenericMethod(innerType);
                return (TResult)fromResultMethod.Invoke(null, new[] { result })!;
            }

            if (genericDef == typeof(ValueTask<>))
            {
                var innerType = resultType.GetGenericArguments()[0];
                var result = Execute(expression, innerType);
                var valueTaskType = typeof(ValueTask<>).MakeGenericType(innerType);
                return (TResult)Activator.CreateInstance(valueTaskType, result)!;
            }
        }

        return _inner.Execute<TResult>(expression);
    }

    private object? Execute(Expression expression, Type returnType)
    {
        var executeMethod = typeof(IQueryProvider)
            .GetMethods()
            .First(m => m.Name == "Execute" && m.IsGenericMethod)
            .MakeGenericMethod(returnType);

        return executeMethod.Invoke(_inner, new object[] { expression });
    }
}

internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public TestAsyncEnumerator(IEnumerator<T> inner)
    {
        _inner = inner;
    }

    public T Current => _inner.Current;

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }

    public ValueTask<bool> MoveNextAsync()
    {
        return ValueTask.FromResult(_inner.MoveNext());
    }
}
