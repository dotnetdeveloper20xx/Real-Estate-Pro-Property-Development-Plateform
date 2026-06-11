# BuildEstate Pro — Testing Standards

## Testing Philosophy
Code that is difficult to test is poorly designed — refactor it.
Tests are not optional. They are part of the definition of done.

---

## Testing Stack

| Tool | Purpose |
|------|---------|
| xUnit | Test framework |
| Moq | Mocking dependencies |
| FluentAssertions | Readable assertions |
| WebApplicationFactory | Integration tests |

---

## What Must Be Tested

### Backend
- All command handlers (business logic) — MANDATORY
- All validators (validation rules) — MANDATORY
- Domain entities (business rules, state transitions) — MANDATORY
- Query handlers (data retrieval) — where complex logic exists
- API endpoints (integration tests) — for critical paths

### Frontend
- NgRx reducers (state transitions) — MANDATORY
- NgRx selectors (derived data) — MANDATORY
- Services (API call structure) — where complex
- Complex components (integration with store)

---

## Test Naming Convention

```
MethodName_Scenario_ExpectedResult
```

Examples:
```csharp
CreateOpportunity_WithValidData_ReturnsCreatedDto
CreateOpportunity_WithDuplicateName_ThrowsConflictException
CreateOpportunity_WithMissingName_ReturnsValidationError
GetOpportunities_WithStatusFilter_ReturnsFilteredList
ChangeStatus_FromIdentifiedToDueDiligence_Succeeds
ChangeStatus_FromDueDiligenceToIdentified_ThrowsInvalidTransition
```

---

## Test Structure (AAA Pattern)

Every test follows Arrange → Act → Assert:

```csharp
[Fact]
public async Task CreateOpportunity_WithValidData_ReturnsCreatedDto()
{
    // Arrange — Set up test data and mocks
    var command = new CreateOpportunityCommand
    {
        Name = "Test Land",
        Location = "London",
        AskingPrice = 500000,
        LandSize = 2.5m
    };

    _repositoryMock.Setup(x => x.AddAsync(It.IsAny<LandOpportunity>(), default))
        .Returns(Task.CompletedTask);
    _unitOfWorkMock.Setup(x => x.SaveChangesAsync(default))
        .ReturnsAsync(1);

    // Act — Execute the code under test
    var result = await _handler.Handle(command, CancellationToken.None);

    // Assert — Verify the outcome
    result.Should().NotBeNull();
    result.Name.Should().Be("Test Land");
    result.Location.Should().Be("London");
    _repositoryMock.Verify(x => x.AddAsync(It.IsAny<LandOpportunity>(), default), Times.Once);
    _unitOfWorkMock.Verify(x => x.SaveChangesAsync(default), Times.Once);
}
```

---

## Test Isolation Rules

- Each test MUST be independent (no shared state)
- Use fresh mocks per test (constructor injection in xUnit)
- Integration tests use separate test database
- No test should depend on execution order
- No test should depend on external services (mock them)

---

## Validator Testing Pattern

```csharp
public class CreateOpportunityCommandValidatorTests
{
    private readonly CreateOpportunityCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_ShouldPassValidation()
    {
        var command = new CreateOpportunityCommand
        {
            Name = "Valid Name",
            Location = "London",
            AskingPrice = 500000
        };

        var result = _validator.Validate(command);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WithEmptyName_ShouldFailValidation()
    {
        var command = new CreateOpportunityCommand
        {
            Name = "",
            Location = "London",
            AskingPrice = 500000
        };

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == "Name");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    [InlineData(-0.01)]
    public void Validate_WithInvalidPrice_ShouldFailValidation(decimal price)
    {
        var command = new CreateOpportunityCommand
        {
            Name = "Test",
            Location = "London",
            AskingPrice = price
        };

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(x => x.PropertyName == "AskingPrice");
    }
}
```

---

## NgRx Reducer Testing (Frontend)

```typescript
describe('Opportunities Reducer', () => {
    it('should set loading to true on loadOpportunities', () => {
        const state = opportunitiesReducer(initialState, loadOpportunities());
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
    });

    it('should populate opportunities on loadOpportunitiesSuccess', () => {
        const opportunities = [{ id: '1', name: 'Test Land' }];
        const state = opportunitiesReducer(
            initialState,
            loadOpportunitiesSuccess({ opportunities })
        );
        expect(state.loading).toBe(false);
        expect(state.opportunities).toEqual(opportunities);
    });

    it('should set error on loadOpportunitiesFailure', () => {
        const state = opportunitiesReducer(
            initialState,
            loadOpportunitiesFailure({ error: 'Network error' })
        );
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Network error');
    });
});
```

---

## Coverage Expectations

| Area | Target |
|------|--------|
| Command handlers | 90%+ |
| Validators | 100% |
| Domain rules | 90%+ |
| API endpoints | 80%+ (integration) |
| NgRx reducers | 100% |
| NgRx selectors | 100% |
| Frontend components | 70%+ (critical paths) |

---

## Running Tests

```bash
# Backend
cd backend
dotnet test --verbosity normal

# Frontend
cd frontend
ng test --watch=false --code-coverage
```
