namespace BuildEstate.Domain.Exceptions;

/// <summary>
/// Thrown when a general business rule is violated.
/// Includes the rule name and details about the violation.
/// </summary>
public class BusinessRuleViolationException : DomainException
{
    public string RuleName { get; }
    public string ViolationDetails { get; }

    public BusinessRuleViolationException(string ruleName, string violationDetails)
        : base($"Business rule '{ruleName}' violated: {violationDetails}")
    {
        RuleName = ruleName;
        ViolationDetails = violationDetails;
    }

    public BusinessRuleViolationException(string ruleName, string violationDetails, Exception innerException)
        : base($"Business rule '{ruleName}' violated: {violationDetails}", innerException)
    {
        RuleName = ruleName;
        ViolationDetails = violationDetails;
    }
}
