namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when a general business rule is violated.
/// Includes the rule name and details about the violation.
/// </summary>
public class BusinessRuleViolationException : DomainException
{
    public string RuleName { get; }
    public string Details { get; }

    public BusinessRuleViolationException(string ruleName, string details)
        : base($"Business rule '{ruleName}' was violated: {details}")
    {
        RuleName = ruleName;
        Details = details;
    }

    public BusinessRuleViolationException(string ruleName, string details, Exception innerException)
        : base($"Business rule '{ruleName}' was violated: {details}", innerException)
    {
        RuleName = ruleName;
        Details = details;
    }
}
