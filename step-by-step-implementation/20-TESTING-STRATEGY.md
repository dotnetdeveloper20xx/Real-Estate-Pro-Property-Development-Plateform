# Phase 20: Testing Strategy

## Philosophy

Tests exist to give you confidence that your code works. They're not optional — they're part of the definition of done. A feature without tests is an unfinished feature.

---

## What To Test (Priority Order)

### Must Test (Non-Negotiable)
1. **Command Handlers** — Business logic that changes state
2. **Validators** — Every validation rule (happy + unhappy paths)
3. **State Machine Transitions** — Valid and invalid status changes
4. **NgRx Reducers** — State transitions are correct
5. **NgRx Selectors** — Derived data calculations

### Should Test
6. **Query Handlers** — Complex filtering/sorting logic
7. **API Endpoints** — Integration tests for critical paths
8. **Services** — Complex business calculations

### Nice To Have
9. **Components** — Render correctly, emit events
10. **Effects** — Side effects triggered correctly

---

## Backend Test Structure

```
tests/BuildEstate.Tests/
├── Features/
│   ├── LandAcquisition/
│   │   ├── Commands/
│   │   │   ├── CreateOpportunityCommandHandlerTests.cs
│   │   │   ├── UpdateOpportunityCommandHandlerTests.cs
│   │   │   └── ChangeStatusCommandHandlerTests.cs
│   │   ├── Validators/
│   │   │   ├── CreateOpportunityCommandValidatorTests.cs
│   │   │   └── UpdateOpportunityCommandValidatorTests.cs
│   │   └── Queries/
│   │       └── GetOpportunitiesQueryHandlerTests.cs
│   ├── Planning/
│   │   └── ... (same structure)
│   └── Finance/
│       └── ...
└── Shared/
    └── TestHelpers.cs
```

---

## Handler Test Pattern

```csharp
public class CreateOpportunityCommandHandlerTests
{
    private readonly Mock<IRepository<LandOpportunity>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<ILogger<CreateOpportunityCommandHandler>> _loggerMock;
    private readonly CreateOpportunityCommandHandler _handler;

    public CreateOpportunityCommandHandlerTests()
    {
        _repositoryMock = new Mock<IRepository<LandOpportunity>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _loggerMock = new Mock<ILogger<CreateOpportunityCommandHandler>>();

        _handler = new CreateOpportunityCommandHandler(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapperMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_WithValidCommand_CreatesOpportunityAndReturnsDto()
    {
        // Arrange
        var command = new CreateOpportunityCommand
        {
            Name = "Test Plot",
            Location = "London",
            AskingPrice = 500000,
            LandSize = 2.5m
        };

        var entity = new LandOpportunity { Id = Guid.NewGuid(), Name = "Test Plot" };
        var dto = new OpportunityDetailDto { Id = entity.Id, Name = "Test Plot" };

        _mapperMock.Setup(m => m.Map<LandOpportunity>(command)).Returns(entity);
        _mapperMock.Setup(m => m.Map<OpportunityDetailDto>(entity)).Returns(dto);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Test Plot");
        _repositoryMock.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_SetsStatusToIdentified()
    {
        // Arrange
        var command = new CreateOpportunityCommand { Name = "Test", Location = "London", AskingPrice = 100, LandSize = 1 };
        var entity = new LandOpportunity();

        _mapperMock.Setup(m => m.Map<LandOpportunity>(command)).Returns(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mapperMock.Setup(m => m.Map<OpportunityDetailDto>(It.IsAny<LandOpportunity>()))
            .Returns(new OpportunityDetailDto());

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        entity.Status.Should().Be(OpportunityStatus.Identified);
    }
}
```

---

## Validator Test Pattern

```csharp
public class CreateOpportunityCommandValidatorTests
{
    private readonly CreateOpportunityCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_Passes()
    {
        var command = ValidCommand();
        var result = _validator.Validate(command);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("   ")]
    public void Validate_WithInvalidName_Fails(string name)
    {
        var command = ValidCommand();
        command.Name = name;
        var result = _validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-0.01)]
    public void Validate_WithInvalidPrice_Fails(decimal price)
    {
        var command = ValidCommand();
        command.AskingPrice = price;
        var result = _validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "AskingPrice");
    }

    private static CreateOpportunityCommand ValidCommand() => new()
    {
        Name = "Test Plot",
        Location = "London",
        AskingPrice = 500000,
        LandSize = 2.5m
    };
}
```

---

## State Machine Test Pattern

```csharp
public class ChangeOpportunityStatusTests
{
    [Theory]
    [InlineData(OpportunityStatus.Identified, OpportunityStatus.InitialReview, true)]
    [InlineData(OpportunityStatus.InitialReview, OpportunityStatus.DueDiligence, true)]
    [InlineData(OpportunityStatus.DueDiligence, OpportunityStatus.Identified, false)]  // Cannot go back
    [InlineData(OpportunityStatus.Acquired, OpportunityStatus.OfferMade, false)]       // Cannot go back
    [InlineData(OpportunityStatus.Identified, OpportunityStatus.Withdrawn, true)]      // Always valid
    public async Task ChangeStatus_ValidatesTransitionCorrectly(
        OpportunityStatus current, OpportunityStatus target, bool shouldSucceed)
    {
        // ... arrange handler with opportunity at 'current' status
        // ... act: try to change to 'target'
        // ... assert: succeeds or throws based on shouldSucceed
    }
}
```

---

## Frontend Test Pattern (NgRx Reducer)

```typescript
describe('OpportunitiesReducer', () => {
    describe('loadOpportunities', () => {
        it('should set loading to true', () => {
            const action = loadOpportunities();
            const state = opportunitiesReducer(initialState, action);
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });
    });

    describe('loadOpportunitiesSuccess', () => {
        it('should populate opportunities and set loading false', () => {
            const opportunities = [{ id: '1', name: 'Test' }] as IOpportunity[];
            const action = loadOpportunitiesSuccess({ opportunities });
            const state = opportunitiesReducer(initialState, action);
            expect(state.loading).toBe(false);
            expect(state.entities['1']).toEqual(opportunities[0]);
        });
    });

    describe('loadOpportunitiesFailure', () => {
        it('should set error and loading false', () => {
            const action = loadOpportunitiesFailure({ error: 'Network error' });
            const state = opportunitiesReducer(initialState, action);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Network error');
        });
    });
});
```

---

## Running Tests

```bash
# Backend — run all tests
cd backend
dotnet test

# Backend — run specific test class
dotnet test --filter "FullyQualifiedName~CreateOpportunityCommandHandlerTests"

# Frontend — run all tests (single run)
cd frontend
ng test --watch=false

# Frontend — with coverage report
ng test --watch=false --code-coverage
```

---

## Coverage Targets

| Area | Minimum | Goal |
|------|---------|------|
| Command Handlers | 85% | 95% |
| Validators | 100% | 100% |
| Domain Rules | 90% | 95% |
| NgRx Reducers | 100% | 100% |
| NgRx Selectors | 100% | 100% |
| Frontend Services | 70% | 85% |

---

*Tests are not overhead. They're the evidence that your code works correctly.*
