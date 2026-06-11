namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Abstract base class for all domain-level exceptions in the BuildEstate platform.
/// Provides a consistent exception hierarchy for domain rule violations.
/// </summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message)
        : base(message)
    {
    }

    protected DomainException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
