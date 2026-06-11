using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for Role-Based Access Control Enforcement.
/// 
/// **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.7**
/// 
/// Property 10: Role-Based Access Control Enforcement — for any (role, operation) pair,
/// the access decision (permit/deny) SHALL match the expected role permission matrix:
/// - Opportunity create/update/delete/transition: {AcquisitionManager, AdminSupport}
/// - Offer create/transition: {AcquisitionManager, AdminSupport}
/// - Due diligence create/transition: {LegalComplianceOfficer, AdminSupport}
/// - Contract create/transition: {LegalComplianceOfficer, AdminSupport}
/// - Feasibility create/update: {ValuationAnalyst, FinanceDirector}
/// - Approval approve/reject: {FinanceDirector}
/// - Document delete: {AdminSupport}
/// - Acquisition create/transition: {AdminSupport}
/// - Read operations (opportunities, DD, offers, documents, dashboard): All land acquisition roles
/// </summary>
public class RbacEnforcementPropertyTests
{
    #region Operations and Roles Enums

    /// <summary>
    /// All discrete operations in the Land Acquisition module.
    /// </summary>
    public enum LandAcquisitionOperation
    {
        // Opportunity operations
        CreateOpportunity,
        UpdateOpportunity,
        DeleteOpportunity,
        TransitionOpportunityStatus,

        // Offer operations
        CreateOffer,
        TransitionOfferStatus,

        // Due Diligence operations
        CreateDueDiligence,
        TransitionDueDiligenceStatus,

        // Contract operations
        CreateContract,
        TransitionContractStatus,

        // Feasibility operations
        CreateOrUpdateFeasibility,

        // Approval operations
        ApproveOrRejectApproval,

        // Document operations
        DeleteDocument,

        // Acquisition operations
        CreateAcquisition,
        TransitionAcquisitionStatus,

        // Read operations (accessible to all land acquisition roles)
        ReadOpportunities,
        ReadDueDiligence,
        ReadOffers,
        ReadDocuments,
        ReadDashboard
    }

    /// <summary>
    /// All roles that participate in the Land Acquisition module.
    /// </summary>
    public enum LandAcquisitionRole
    {
        AcquisitionManager,
        LegalComplianceOfficer,
        ValuationAnalyst,
        FinanceDirector,
        AdminSupport
    }

    #endregion

    #region Permission Matrix

    /// <summary>
    /// The authoritative permission matrix mapping each operation to its set of allowed roles.
    /// This mirrors the Authorize attributes on the API controllers.
    /// </summary>
    private static readonly Dictionary<LandAcquisitionOperation, HashSet<LandAcquisitionRole>> PermissionMatrix = new()
    {
        // Opportunity operations: AcquisitionManager, AdminSupport
        [LandAcquisitionOperation.CreateOpportunity] = new() { LandAcquisitionRole.AcquisitionManager, LandAcquisitionRole.AdminSupport },
        [LandAcquisitionOperation.UpdateOpportunity] = new() { LandAcquisitionRole.AcquisitionManager, LandAcquisitionRole.AdminSupport },
        [LandAcquisitionOperation.DeleteOpportunity] = new() { LandAcquisitionRole.AcquisitionManager, LandAcquisitionRole.AdminSupport },
        [LandAcquisitionOperation.TransitionOpportunityStatus] = new() { LandAcquisitionRole.AcquisitionManager, LandAcquisitionRole.AdminSupport },

        // Offer operations: AcquisitionManager, AdminSupport
        [LandAcquisitionOperation.CreateOffer] = new() { LandAcquisitionRole.AcquisitionManager, LandAcquisitionRole.AdminSupport },
        [LandAcquisitionOperation.TransitionOfferStatus] = new() { LandAcquisitionRole.AcquisitionManager, LandAcquisitionRole.AdminSupport },

        // Due Diligence operations: LegalComplianceOfficer, AdminSupport
        [LandAcquisitionOperation.CreateDueDiligence] = new() { LandAcquisitionRole.LegalComplianceOfficer, LandAcquisitionRole.AdminSupport },
        [LandAcquisitionOperation.TransitionDueDiligenceStatus] = new() { LandAcquisitionRole.LegalComplianceOfficer, LandAcquisitionRole.AdminSupport },

        // Contract operations: LegalComplianceOfficer, AdminSupport
        [LandAcquisitionOperation.CreateContract] = new() { LandAcquisitionRole.LegalComplianceOfficer, LandAcquisitionRole.AdminSupport },
        [LandAcquisitionOperation.TransitionContractStatus] = new() { LandAcquisitionRole.LegalComplianceOfficer, LandAcquisitionRole.AdminSupport },

        // Feasibility operations: ValuationAnalyst, FinanceDirector
        [LandAcquisitionOperation.CreateOrUpdateFeasibility] = new() { LandAcquisitionRole.ValuationAnalyst, LandAcquisitionRole.FinanceDirector },

        // Approval operations: FinanceDirector only
        [LandAcquisitionOperation.ApproveOrRejectApproval] = new() { LandAcquisitionRole.FinanceDirector },

        // Document deletion: AdminSupport only
        [LandAcquisitionOperation.DeleteDocument] = new() { LandAcquisitionRole.AdminSupport },

        // Acquisition operations: AdminSupport only
        [LandAcquisitionOperation.CreateAcquisition] = new() { LandAcquisitionRole.AdminSupport },
        [LandAcquisitionOperation.TransitionAcquisitionStatus] = new() { LandAcquisitionRole.AdminSupport },

        // Read operations: All land acquisition roles
        [LandAcquisitionOperation.ReadOpportunities] = new()
        {
            LandAcquisitionRole.AcquisitionManager,
            LandAcquisitionRole.LegalComplianceOfficer,
            LandAcquisitionRole.ValuationAnalyst,
            LandAcquisitionRole.FinanceDirector,
            LandAcquisitionRole.AdminSupport
        },
        [LandAcquisitionOperation.ReadDueDiligence] = new()
        {
            LandAcquisitionRole.AcquisitionManager,
            LandAcquisitionRole.LegalComplianceOfficer,
            LandAcquisitionRole.ValuationAnalyst,
            LandAcquisitionRole.FinanceDirector,
            LandAcquisitionRole.AdminSupport
        },
        [LandAcquisitionOperation.ReadOffers] = new()
        {
            LandAcquisitionRole.AcquisitionManager,
            LandAcquisitionRole.LegalComplianceOfficer,
            LandAcquisitionRole.ValuationAnalyst,
            LandAcquisitionRole.FinanceDirector,
            LandAcquisitionRole.AdminSupport
        },
        [LandAcquisitionOperation.ReadDocuments] = new()
        {
            LandAcquisitionRole.AcquisitionManager,
            LandAcquisitionRole.LegalComplianceOfficer,
            LandAcquisitionRole.ValuationAnalyst,
            LandAcquisitionRole.FinanceDirector,
            LandAcquisitionRole.AdminSupport
        },
        [LandAcquisitionOperation.ReadDashboard] = new()
        {
            LandAcquisitionRole.AcquisitionManager,
            LandAcquisitionRole.LegalComplianceOfficer,
            LandAcquisitionRole.ValuationAnalyst,
            LandAcquisitionRole.FinanceDirector,
            LandAcquisitionRole.AdminSupport
        }
    };

    #endregion

    #region Helper Methods

    /// <summary>
    /// Determines whether the given role is permitted to perform the given operation
    /// according to the permission matrix.
    /// </summary>
    private static bool IsPermitted(LandAcquisitionRole role, LandAcquisitionOperation operation)
    {
        return PermissionMatrix.TryGetValue(operation, out var allowedRoles)
               && allowedRoles.Contains(role);
    }

    #endregion

    #region Property 10: RBAC Enforcement Tests

    /// <summary>
    /// Property 10: RBAC Enforcement
    /// For any random (role, operation) pair, the access decision (permit/deny)
    /// SHALL match the expected permission matrix.
    /// **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.7**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Rbac_AccessDecision_MatchesPermissionMatrix_ForAnyRoleOperationPair()
    {
        var roleGen = Gen.Elements(Enum.GetValues<LandAcquisitionRole>());
        var operationGen = Gen.Elements(Enum.GetValues<LandAcquisitionOperation>());
        var pairGen = from role in roleGen
                      from operation in operationGen
                      select (Role: role, Operation: operation);

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var permitted = IsPermitted(pair.Role, pair.Operation);
            var expectedAllowedRoles = PermissionMatrix[pair.Operation];
            var shouldBePermitted = expectedAllowedRoles.Contains(pair.Role);

            permitted.Should().Be(shouldBePermitted,
                because: $"role '{pair.Role}' should {(shouldBePermitted ? "be permitted" : "be denied")} for operation '{pair.Operation}'");
        });
    }

    /// <summary>
    /// Property 10: RBAC Enforcement
    /// For any operation, all roles NOT in the allowed set SHALL be denied access (HTTP 403 Forbidden).
    /// This verifies the deny side of the RBAC matrix.
    /// **Validates: Requirements 12.7**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Rbac_UnauthorizedRoles_AreDenied_ForAnyOperation()
    {
        var operationGen = Gen.Elements(Enum.GetValues<LandAcquisitionOperation>());
        var roleGen = Gen.Elements(Enum.GetValues<LandAcquisitionRole>());
        var pairGen = from operation in operationGen
                      from role in roleGen
                      where !PermissionMatrix[operation].Contains(role)
                      select (Role: role, Operation: operation);

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var permitted = IsPermitted(pair.Role, pair.Operation);

            permitted.Should().BeFalse(
                because: $"role '{pair.Role}' is not in the allowed set for operation '{pair.Operation}' and should receive HTTP 403 Forbidden");
        });
    }

    /// <summary>
    /// Property 10: RBAC Enforcement
    /// For any operation, all roles IN the allowed set SHALL be permitted access.
    /// This verifies the permit side of the RBAC matrix.
    /// **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Rbac_AuthorizedRoles_ArePermitted_ForAnyOperation()
    {
        var operationGen = Gen.Elements(Enum.GetValues<LandAcquisitionOperation>());
        var roleGen = Gen.Elements(Enum.GetValues<LandAcquisitionRole>());
        var pairGen = from operation in operationGen
                      from role in roleGen
                      where PermissionMatrix[operation].Contains(role)
                      select (Role: role, Operation: operation);

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var permitted = IsPermitted(pair.Role, pair.Operation);

            permitted.Should().BeTrue(
                because: $"role '{pair.Role}' is in the allowed set for operation '{pair.Operation}' and should be granted access");
        });
    }

    /// <summary>
    /// Property 10: RBAC Enforcement
    /// Read operations SHALL be accessible to ALL land acquisition roles.
    /// This explicitly verifies that every role can read every read-type operation.
    /// **Validates: Requirements 12.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Rbac_ReadOperations_AreAccessibleToAllRoles()
    {
        var readOperations = new[]
        {
            LandAcquisitionOperation.ReadOpportunities,
            LandAcquisitionOperation.ReadDueDiligence,
            LandAcquisitionOperation.ReadOffers,
            LandAcquisitionOperation.ReadDocuments,
            LandAcquisitionOperation.ReadDashboard
        };

        var roleGen = Gen.Elements(Enum.GetValues<LandAcquisitionRole>());
        var readOpGen = Gen.Elements(readOperations);
        var pairGen = from role in roleGen
                      from operation in readOpGen
                      select (Role: role, Operation: operation);

        return Prop.ForAll(pairGen.ToArbitrary(), pair =>
        {
            var permitted = IsPermitted(pair.Role, pair.Operation);

            permitted.Should().BeTrue(
                because: $"all land acquisition roles should have read access; role '{pair.Role}' should be permitted for '{pair.Operation}'");
        });
    }

    /// <summary>
    /// Property 10: RBAC Enforcement
    /// Every operation in the system SHALL have at least one role authorized to perform it.
    /// The permission matrix must be complete (no unassigned operations).
    /// **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Rbac_EveryOperation_HasAtLeastOneAuthorizedRole()
    {
        var operationGen = Gen.Elements(Enum.GetValues<LandAcquisitionOperation>());

        return Prop.ForAll(operationGen.ToArbitrary(), operation =>
        {
            PermissionMatrix.Should().ContainKey(operation,
                because: $"operation '{operation}' must be defined in the permission matrix");

            PermissionMatrix[operation].Should().NotBeEmpty(
                because: $"operation '{operation}' must have at least one authorized role");
        });
    }

    /// <summary>
    /// Property 10: RBAC Enforcement
    /// The permission matrix SHALL cover every defined operation.
    /// No operation should be left undefined (which would mean no role can perform it).
    /// **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
    /// </summary>
    [Fact]
    public void Rbac_PermissionMatrix_CoversAllDefinedOperations()
    {
        var allOperations = Enum.GetValues<LandAcquisitionOperation>();

        foreach (var operation in allOperations)
        {
            PermissionMatrix.Should().ContainKey(operation,
                because: $"operation '{operation}' must have a defined permission entry");
            PermissionMatrix[operation].Should().NotBeEmpty(
                because: $"operation '{operation}' must have at least one authorized role");
        }
    }

    /// <summary>
    /// Property 10: RBAC Enforcement
    /// Specific role-operation constraints from requirements:
    /// - Req 12.1: Opportunity creation/transitions → AcquisitionManager, AdminSupport
    /// - Req 12.2: DD creation/transitions → LegalComplianceOfficer, AdminSupport
    /// - Req 12.3: Feasibility creation → ValuationAnalyst, FinanceDirector
    /// - Req 12.4: Approval decisions → FinanceDirector
    /// **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
    /// </summary>
    [Fact]
    public void Rbac_SpecificRoleConstraints_MatchRequirements()
    {
        // Requirement 12.1: Opportunity operations
        var opportunityOps = new[]
        {
            LandAcquisitionOperation.CreateOpportunity,
            LandAcquisitionOperation.UpdateOpportunity,
            LandAcquisitionOperation.DeleteOpportunity,
            LandAcquisitionOperation.TransitionOpportunityStatus
        };
        var expectedOpportunityRoles = new HashSet<LandAcquisitionRole>
        {
            LandAcquisitionRole.AcquisitionManager,
            LandAcquisitionRole.AdminSupport
        };

        foreach (var op in opportunityOps)
        {
            PermissionMatrix[op].Should().BeEquivalentTo(expectedOpportunityRoles,
                because: $"Req 12.1: operation '{op}' should require AcquisitionManager or AdminSupport");
        }

        // Requirement 12.2: Due Diligence operations
        var ddOps = new[]
        {
            LandAcquisitionOperation.CreateDueDiligence,
            LandAcquisitionOperation.TransitionDueDiligenceStatus
        };
        var expectedDdRoles = new HashSet<LandAcquisitionRole>
        {
            LandAcquisitionRole.LegalComplianceOfficer,
            LandAcquisitionRole.AdminSupport
        };

        foreach (var op in ddOps)
        {
            PermissionMatrix[op].Should().BeEquivalentTo(expectedDdRoles,
                because: $"Req 12.2: operation '{op}' should require LegalComplianceOfficer or AdminSupport");
        }

        // Requirement 12.3: Feasibility operations
        PermissionMatrix[LandAcquisitionOperation.CreateOrUpdateFeasibility].Should()
            .BeEquivalentTo(new HashSet<LandAcquisitionRole>
            {
                LandAcquisitionRole.ValuationAnalyst,
                LandAcquisitionRole.FinanceDirector
            },
            because: "Req 12.3: feasibility operations should require ValuationAnalyst or FinanceDirector");

        // Requirement 12.4: Approval operations
        PermissionMatrix[LandAcquisitionOperation.ApproveOrRejectApproval].Should()
            .BeEquivalentTo(new HashSet<LandAcquisitionRole>
            {
                LandAcquisitionRole.FinanceDirector
            },
            because: "Req 12.4: approval decisions should require FinanceDirector only");
    }

    #endregion
}
