# BuildEstate Pro — Testing & Observability Standards

## Testing Philosophy
Create software that is **designed for testability** from the start.
If code is difficult to test, it is poorly designed — refactor it.

## Testing Stack
- **Unit Tests:** xUnit
- **Mocking:** Moq
- **Assertions:** FluentAssertions
- **Integration Tests:** WebApplicationFactory
- **Frontend Tests:** Jasmine / Karma (Angular default) or Jest

## What Must Be Tested

### Backend
- All command handlers (business logic)
- All query handlers (data retrieval logic)
- All validators (validation rules)
- Domain entities (business rules, state transitions)
- Repository methods (integration tests against test DB)
- API endpoints (integration tests)
- Middleware behavior (exception handling, auth)

### Frontend
- Smart components (integration with store)
- Complex presentational components
- Services (API call structure)
- Pipes and custom validators
- NgRx reducers, selectors, effects

## Test Naming Convention
```
MethodName_Scenario_ExpectedResult

// Examples:
CreateOpportunity_WithValidData_ReturnsCreatedDto
CreateOpportunity_WithDuplicateName_ThrowsConflictException
GetOpportunities_WithStatusFilter_ReturnsFilteredList
Validate_WithMissingName_ReturnsValidationError
```

## Test Structure (AAA Pattern)
```csharp
[Fact]
public async Task CreateOpportunity_WithValidData_ReturnsCreatedDto()
{
    // Arrange
    var command = new CreateOpportunityCommand { Name = "Test Land", Location = "London" };
    _repositoryMock.Setup(x => x.AddAsync(It.IsAny<LandOpportunity>(), default))
        .ReturnsAsync(new LandOpportunity());

    // Act
    var result = await _handler.Handle(command, CancellationToken.None);

    // Assert
    result.Should().NotBeNull();
    result.Name.Should().Be("Test Land");
    _repositoryMock.Verify(x => x.AddAsync(It.IsAny<LandOpportunity>(), default), Times.Once);
}
```

## Test Isolation
- Each test must be independent (no shared state)
- Use fresh mocks per test
- Integration tests use separate test database
- Clean up test data after each run
- No test should depend on execution order

## Coverage Expectations
- Business logic: 90%+ coverage
- Validators: 100% coverage
- API endpoints: 80%+ coverage (integration tests)
- Frontend components: 70%+ (critical paths)
- Infrastructure: tested via integration tests

---

## Observability Standards

### Structured Logging
Every important operation must be traceable in production.

```csharp
// Use structured logging with properties
_logger.LogInformation(
    "Opportunity {OpportunityId} status changed from {OldStatus} to {NewStatus} by {UserId}",
    opportunityId, oldStatus, newStatus, userId);
```

### Log Levels
- **Trace:** Detailed diagnostic info (dev only)
- **Debug:** Internal flow details (dev/staging)
- **Information:** Business events (opportunity created, status changed)
- **Warning:** Recoverable issues (retry, fallback, degraded)
- **Error:** Failures that need attention (unhandled exceptions, integration failures)
- **Critical:** System-level failures (DB down, auth service down)

### Correlation IDs
- Every HTTP request gets a unique correlation ID
- Correlation ID propagates through all layers
- Correlation ID appears in all log entries for that request
- Frontend sends correlation ID in headers for traceability

### Audit Logs (Business Events)
Separate from technical logs. Business audit captures:
- WHO did it (user ID, user name, role)
- WHAT they did (action, entity, entity ID)
- WHEN they did it (UTC timestamp)
- FROM WHERE (IP address, user agent)
- WHAT CHANGED (old values → new values)

### Health Checks
- Database connectivity
- External API availability
- File storage availability
- Memory/CPU thresholds
- Endpoint: `/health` (unauthenticated)

### Performance Metrics (Future)
- Request duration per endpoint
- Database query duration
- External API call duration
- Error rate per endpoint
- Active user count
- Queue depth (if using message queues)

### Production Support
Design logging and observability so that production support teams can:
- Trace any user's actions through the system
- Identify the root cause of errors within minutes
- Understand system behavior without reading source code
- Generate compliance reports from audit data
- Investigate data discrepancies via audit trail
