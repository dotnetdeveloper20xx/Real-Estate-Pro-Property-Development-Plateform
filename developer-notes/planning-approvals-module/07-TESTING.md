# Planning & Approvals Module — Testing

## Testing Philosophy

This module uses **property-based testing** (PBT) as its primary correctness verification mechanism. Rather than testing specific examples, property tests verify that rules hold true across all possible inputs — generated randomly by the FsCheck library.

## Property-Based Tests (FsCheck — 16 test files)

Each test validates a formal correctness property defined in the design document.

### State Machine Tests (Properties 1-4)
| File | Property | What It Verifies |
|------|----------|------------------|
| PlanningStatusStateMachinePropertyTests | Property 1 | Only defined transitions accepted for application status |
| ConditionStatusStateMachinePropertyTests | Property 2 | Only defined transitions accepted for condition status |
| AppealStatusStateMachinePropertyTests | Property 3 | Only defined transitions accepted for appeal status |
| FeeStatusStateMachinePropertyTests | Property 4 | Only defined transitions accepted for fee payment status |

### Domain Logic Tests (Properties 5-18)
| File | Property | What It Verifies |
|------|----------|------------------|
| ApplicationCreationPropertyTests | 5, 6, 7 | Only Acquired opportunities allow creation; active uniqueness; field boundaries |
| ConditionalTransitionDataPropertyTests | 8 | ApplicationReference (5-50), DecisionDate (not future), WithdrawalReason (10+) |
| ConditionCreationPropertyTests | 9 | Only ApprovedWithConditions parent allows creation; produces Outstanding status |
| AppealCreationPropertyTests | 10 | Only Refused parent and no active appeal; produces Lodged with LodgedDate |
| AppealCascadePropertyTests | 11 | Appeal Allowed correctly cascades to parent application status |
| MilestoneVariancePropertyTests | 12 | VarianceDays = (ActualDate - TargetDate).Days for all date pairs |
| MilestoneUniquenessPropertyTests | 13 | Duplicate MilestoneType per application always rejected |
| FeeThresholdPropertyTests | 14 | Above-threshold fees cannot skip approval path |
| FeeAggregationPropertyTests | 15 | Group sums equal mathematical sum for all fee combinations |
| KpiCalculationPropertyTests | 16, 17 | ApprovalRate and AppealSuccessRate formulas verified |
| SoftDeleteExclusionPropertyTests | 18 | Queries never return IsDeleted = true records |
| FilterSortPropertyTests | 19, 20 | Filter results satisfy all predicates; sort order is correct |

### Event Handler Tests (4 test files)
| File | What It Verifies |
|------|------------------|
| ApplicationStatusChangedEventHandlerTests | Notifications sent on decision statuses; not sent on non-decision statuses |
| FeeRequiresApprovalEventHandlerTests | Finance Director notified with correct amount/currency details |
| ApproveFeeCommandHandlerTests | Fee approval logic, status validation, handler correctness |
| CheckOverdueMilestonesTests | Overdue detection and notification triggering |

### Infrastructure Tests (1 test file)
| File | What It Verifies |
|------|------------------|
| PlanningEntitiesSoftDeleteQueryFilterTests | All 7 entity types excluded when IsDeleted=true; IgnoreQueryFilters works |

## Test Counts

- **Property tests:** ~16 files × 3-12 properties each = ~100+ individual test iterations
- **Each property test runs 50-200 random inputs** (configurable via `MaxTest`)
- **Event handler tests:** ~15 unit tests
- **Infrastructure tests:** 8 integration tests
- **Total test execution:** 150+ test methods

## How Property Tests Work

```csharp
// Example: Property 5 — Only Acquired status allows application creation
[Property(MaxTest = 100)]
public Property ApplicationCreation_OnlyAcquiredStatus_AllowsCreation()
{
    return Prop.ForAll(
        Gen.Elements(allStatuses).ToArbitrary(),  // Generate ALL possible status values
        status =>
        {
            // Attempt to create an application for this status
            if (status == OpportunityStatus.Acquired)
                // Should succeed
            else
                // Should throw BusinessRuleViolationException
        });
}
```

This runs 100 times with different randomly-selected statuses, proving the rule holds universally.

## Running Tests

```bash
# Run all tests
dotnet test

# Run only Planning & Approvals property tests
dotnet test --filter "FullyQualifiedName~PlanningApprovals"

# Run with verbose output
dotnet test --filter "FullyQualifiedName~PlanningApprovals" --logger "console;verbosity=detailed"
```
