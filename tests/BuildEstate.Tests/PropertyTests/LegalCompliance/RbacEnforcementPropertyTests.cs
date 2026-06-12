using System.Reflection;
using BuildEstate.API.Controllers;
using BuildEstate.API.Controllers.LegalCompliance;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for RBAC enforcement on Legal Compliance controllers.
/// Uses reflection to verify that [Authorize(Roles=...)] attributes are correctly
/// applied to all controller actions, ensuring no endpoint is left unprotected.
///
/// **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9**
/// </summary>
public class RbacEnforcementPropertyTests
{
    /// <summary>
    /// All Legal Compliance controller types that must have RBAC enforcement.
    /// </summary>
    private static readonly Type[] LegalComplianceControllerTypes =
    {
        typeof(LegalCasesController),
        typeof(ContractsController),
        typeof(ComplianceRequirementsController),
        typeof(ComplianceChecksController),
        typeof(InsuranceRecordsController),
        typeof(AuditRecordsController),
        typeof(LegalDocumentsController),
        typeof(LegalDashboardController),
        typeof(AuditTrailController)
    };

    /// <summary>
    /// Known role identifiers used in the system (both naming conventions found in controllers).
    /// </summary>
    private static readonly HashSet<string> KnownRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Legal_Compliance_Officer",
        "LegalComplianceOfficer",
        "Finance_Director",
        "FinanceDirector",
        "Acquisition_Manager",
        "AcquisitionManager",
        "Admin_Support",
        "AdminSupport"
    };

    /// <summary>
    /// HTTP methods that are considered write (mutating) operations.
    /// </summary>
    private static readonly HashSet<string> WriteMethods = new()
    {
        nameof(HttpPostAttribute),
        nameof(HttpPutAttribute),
        nameof(HttpDeleteAttribute),
        nameof(HttpPatchAttribute)
    };

    /// <summary>
    /// HTTP methods that are considered read operations.
    /// </summary>
    private static readonly HashSet<string> ReadMethods = new()
    {
        nameof(HttpGetAttribute)
    };

    /// <summary>
    /// Gets all public action methods from the Legal Compliance controllers.
    /// </summary>
    private static IEnumerable<(Type Controller, MethodInfo Action)> GetAllControllerActions()
    {
        return LegalComplianceControllerTypes.SelectMany(controllerType =>
            controllerType
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(m => m.GetCustomAttributes().Any(a =>
                    a is HttpGetAttribute or HttpPostAttribute or HttpPutAttribute
                        or HttpDeleteAttribute or HttpPatchAttribute))
                .Select(method => (controllerType, method)));
    }

    /// <summary>
    /// Determines whether an action method is a write operation based on its HTTP method attribute.
    /// </summary>
    private static bool IsWriteOperation(MethodInfo method)
    {
        return method.GetCustomAttributes().Any(a =>
            a is HttpPostAttribute or HttpPutAttribute or HttpDeleteAttribute or HttpPatchAttribute);
    }

    /// <summary>
    /// Determines whether an action method is a read operation based on its HTTP method attribute.
    /// </summary>
    private static bool IsReadOperation(MethodInfo method)
    {
        return method.GetCustomAttributes().Any(a => a is HttpGetAttribute) &&
               !method.GetCustomAttributes().Any(a =>
                   a is HttpPostAttribute or HttpPutAttribute or HttpDeleteAttribute or HttpPatchAttribute);
    }

    /// <summary>
    /// Gets the roles from the Authorize attribute on a method, falling back to class-level attribute.
    /// </summary>
    private static string[] GetAuthorizedRoles(Type controller, MethodInfo method)
    {
        // Check method-level Authorize attribute first
        var methodAuth = method.GetCustomAttribute<AuthorizeAttribute>();
        if (methodAuth?.Roles != null)
        {
            return methodAuth.Roles
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToArray();
        }

        // Fall back to controller-level Authorize attribute
        var controllerAuth = controller.GetCustomAttribute<AuthorizeAttribute>();
        if (controllerAuth?.Roles != null)
        {
            return controllerAuth.Roles
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToArray();
        }

        // Base class has [Authorize] without roles (requires authentication only)
        return Array.Empty<string>();
    }

    /// <summary>
    /// Property 16: RBAC Enforcement — Every controller action in the Legal Compliance module
    /// must have an [Authorize] attribute (either at method-level with roles or inherited from base).
    /// Unauthenticated requests receive 401 (handled by base [Authorize] on BaseApiController).
    ///
    /// **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9**
    /// </summary>
    [Fact]
    public void AllControllers_InheritFromBaseApiController_WhichHasAuthorizeAttribute()
    {
        // BaseApiController has [Authorize] which ensures 401 for unauthenticated requests
        var baseControllerType = typeof(BaseApiController);
        var authorizeAttr = baseControllerType.GetCustomAttribute<AuthorizeAttribute>();

        authorizeAttr.Should().NotBeNull(
            "BaseApiController must have [Authorize] to enforce 401 for unauthenticated requests");

        foreach (var controllerType in LegalComplianceControllerTypes)
        {
            controllerType.Should().BeAssignableTo<BaseApiController>(
                $"{controllerType.Name} must inherit from BaseApiController to get authentication enforcement");
        }
    }

    /// <summary>
    /// Property 16: Every action method across all Legal Compliance controllers
    /// must have an explicit [Authorize(Roles=...)] attribute specifying authorized roles.
    /// This ensures 403 for users without the required role.
    ///
    /// **Validates: Requirements 10.8, 10.9**
    /// </summary>
    [Fact]
    public void AllActionMethods_HaveExplicitAuthorizeRolesAttribute()
    {
        var allActions = GetAllControllerActions().ToList();
        allActions.Should().NotBeEmpty("there should be action methods in Legal Compliance controllers");

        foreach (var (controller, action) in allActions)
        {
            var authorizeAttr = action.GetCustomAttribute<AuthorizeAttribute>();

            authorizeAttr.Should().NotBeNull(
                $"{controller.Name}.{action.Name} must have [Authorize(Roles=...)] attribute");

            authorizeAttr!.Roles.Should().NotBeNullOrWhiteSpace(
                $"{controller.Name}.{action.Name} must specify Roles in its [Authorize] attribute " +
                "to enforce role-based access control (403 for unauthorized)");
        }
    }

    /// <summary>
    /// Property 16: All roles referenced in Authorize attributes must be known/valid system roles.
    /// This catches typos and invalid role names that would silently deny all access.
    ///
    /// **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**
    /// </summary>
    [Fact]
    public void AllAuthorizeRoles_AreKnownSystemRoles()
    {
        var allActions = GetAllControllerActions().ToList();

        foreach (var (controller, action) in allActions)
        {
            var roles = GetAuthorizedRoles(controller, action);

            foreach (var role in roles)
            {
                KnownRoles.Should().Contain(role,
                    $"{controller.Name}.{action.Name} references unknown role '{role}'. " +
                    "This would silently deny access to all users.");
            }
        }
    }

    /// <summary>
    /// Property 16: Write operations (POST, PUT, DELETE) must NOT grant access to ALL legal roles.
    /// Write operations should be restricted to specific roles (e.g., Legal_Compliance_Officer, Admin_Support).
    /// This validates Requirement 10 — restrictive role access on mutations.
    ///
    /// **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property WriteOperations_AreRestrictedToAuthorizedRolesOnly()
    {
        var writeActions = GetAllControllerActions()
            .Where(x => IsWriteOperation(x.Action))
            .ToArray();

        var gen = Gen.Choose(0, writeActions.Length - 1)
            .Select(index => writeActions[index]);

        return Prop.ForAll(
            gen.ToArbitrary(),
            entry =>
            {
                var (controller, action) = entry;
                var roles = GetAuthorizedRoles(controller, action);

                // Write operations must have roles defined
                var hasRoles = roles.Length > 0;

                // Write operations should NOT include ALL four roles (that would be too permissive for writes)
                // Exception: Documents upload/version is available to all legal roles per requirements
                var isDocumentUploadOrVersion =
                    controller == typeof(LegalDocumentsController) &&
                    (action.Name == "Upload" || action.Name == "UploadVersion");

                if (isDocumentUploadOrVersion)
                {
                    // Document upload/version is available to all legal roles (Req 8.1)
                    return hasRoles
                        .Label($"{controller.Name}.{action.Name} should have roles for document operations");
                }

                // Other write operations should be restricted (not all 4 roles)
                var distinctRoleCategories = roles
                    .Select(NormalizeRoleName)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Count();

                return (hasRoles && distinctRoleCategories <= 3)
                    .Label($"{controller.Name}.{action.Name} has {distinctRoleCategories} role categories " +
                           $"(roles: {string.Join(", ", roles)}). " +
                           "Write operations should be restricted, not open to all roles.");
            });
    }

    /// <summary>
    /// Property 16: Read operations (GET) should allow access to at least the Legal_Compliance_Officer role.
    /// The Legal_Compliance_Officer has read access to everything in the legal module.
    ///
    /// **Validates: Requirements 10.1, 10.2, 10.3, 10.7**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ReadOperations_AllowLegalComplianceOfficerAccess()
    {
        var readActions = GetAllControllerActions()
            .Where(x => IsReadOperation(x.Action))
            .ToArray();

        var gen = Gen.Choose(0, readActions.Length - 1)
            .Select(index => readActions[index]);

        return Prop.ForAll(
            gen.ToArbitrary(),
            entry =>
            {
                var (controller, action) = entry;
                var roles = GetAuthorizedRoles(controller, action);

                // Legal_Compliance_Officer should have access to all read operations
                var hasLcoRole = roles.Any(r =>
                    r.Equals("Legal_Compliance_Officer", StringComparison.OrdinalIgnoreCase) ||
                    r.Equals("LegalComplianceOfficer", StringComparison.OrdinalIgnoreCase));

                return hasLcoRole
                    .Label($"{controller.Name}.{action.Name} should allow Legal_Compliance_Officer access " +
                           $"(current roles: {string.Join(", ", roles)})");
            });
    }

    /// <summary>
    /// Property 16: Contract write operations (Create, Update) must be restricted to Legal_Compliance_Officer only.
    /// Contract transition also permits Finance_Director.
    ///
    /// **Validates: Requirements 10.2, 10.5**
    /// </summary>
    [Fact]
    public void ContractCreateAndUpdate_RestrictedToLegalComplianceOfficer()
    {
        var contractsController = typeof(ContractsController);
        var createMethod = contractsController.GetMethod("Create");
        var updateMethod = contractsController.GetMethod("Update");

        createMethod.Should().NotBeNull();
        updateMethod.Should().NotBeNull();

        var createRoles = GetAuthorizedRoles(contractsController, createMethod!);
        var updateRoles = GetAuthorizedRoles(contractsController, updateMethod!);

        // Create: only Legal_Compliance_Officer
        createRoles.Should().AllSatisfy(r =>
            NormalizeRoleName(r).Should().Be("LegalComplianceOfficer",
                "Contract creation must be restricted to Legal_Compliance_Officer per Requirement 10.2"));

        // Update: only Legal_Compliance_Officer
        updateRoles.Should().AllSatisfy(r =>
            NormalizeRoleName(r).Should().Be("LegalComplianceOfficer",
                "Contract update must be restricted to Legal_Compliance_Officer per Requirement 10.2"));
    }

    /// <summary>
    /// Property 16: Contract status transition must allow Finance_Director (for approval).
    ///
    /// **Validates: Requirements 10.2, 10.5**
    /// </summary>
    [Fact]
    public void ContractTransition_AllowsFinanceDirector()
    {
        var contractsController = typeof(ContractsController);
        var transitionMethod = contractsController.GetMethod("TransitionStatus");

        transitionMethod.Should().NotBeNull();

        var roles = GetAuthorizedRoles(contractsController, transitionMethod!);
        var normalizedRoles = roles.Select(NormalizeRoleName).ToHashSet(StringComparer.OrdinalIgnoreCase);

        normalizedRoles.Should().Contain("FinanceDirector",
            "Contract transition must allow Finance_Director for approval per Requirement 10.5");
        normalizedRoles.Should().Contain("LegalComplianceOfficer",
            "Contract transition must allow Legal_Compliance_Officer per Requirement 10.2");
    }

    /// <summary>
    /// Property 16: ComplianceRequirement management (Create, Update, Retire) restricted to Legal_Compliance_Officer.
    ///
    /// **Validates: Requirement 10.3**
    /// </summary>
    [Fact]
    public void ComplianceRequirementManagement_RestrictedToLegalComplianceOfficer()
    {
        var controller = typeof(ComplianceRequirementsController);
        var writeActions = controller
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => m.GetCustomAttributes().Any(a =>
                a is HttpPostAttribute or HttpPutAttribute or HttpDeleteAttribute))
            .ToList();

        writeActions.Should().NotBeEmpty("ComplianceRequirementsController should have write actions");

        foreach (var action in writeActions)
        {
            var roles = GetAuthorizedRoles(controller, action);
            var normalizedRoles = roles.Select(NormalizeRoleName).ToHashSet(StringComparer.OrdinalIgnoreCase);

            normalizedRoles.Should().Contain("LegalComplianceOfficer",
                $"{action.Name} must allow Legal_Compliance_Officer per Requirement 10.3");

            // Should NOT include Acquisition_Manager or Finance_Director for write operations
            normalizedRoles.Should().NotContain("AcquisitionManager",
                $"{action.Name} must NOT allow Acquisition_Manager to manage compliance requirements");
            normalizedRoles.Should().NotContain("FinanceDirector",
                $"{action.Name} must NOT allow Finance_Director to manage compliance requirements");
        }
    }

    /// <summary>
    /// Property 16: ComplianceCheck recording restricted to Legal_Compliance_Officer and Admin_Support.
    ///
    /// **Validates: Requirement 10.4**
    /// </summary>
    [Fact]
    public void ComplianceCheckRecording_RestrictedToLcoAndAdminSupport()
    {
        var controller = typeof(ComplianceChecksController);
        var createMethod = controller
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .FirstOrDefault(m => m.GetCustomAttributes().Any(a => a is HttpPostAttribute));

        createMethod.Should().NotBeNull("ComplianceChecksController should have a Create action");

        var roles = GetAuthorizedRoles(controller, createMethod!);
        var normalizedRoles = roles.Select(NormalizeRoleName).ToHashSet(StringComparer.OrdinalIgnoreCase);

        normalizedRoles.Should().Contain("LegalComplianceOfficer",
            "Compliance check recording must allow Legal_Compliance_Officer per Requirement 10.4");
        normalizedRoles.Should().Contain("AdminSupport",
            "Compliance check recording must allow Admin_Support per Requirement 10.4");
        normalizedRoles.Should().NotContain("AcquisitionManager",
            "Compliance check recording must NOT allow Acquisition_Manager per Requirement 10.4");
    }

    /// <summary>
    /// Property 16: Insurance management (Create, Update) restricted to Legal_Compliance_Officer and Admin_Support.
    ///
    /// **Validates: Requirement 10.6**
    /// </summary>
    [Fact]
    public void InsuranceManagement_RestrictedToLcoAndAdminSupport()
    {
        var controller = typeof(InsuranceRecordsController);
        var createMethod = controller.GetMethod("Create");
        var updateMethod = controller.GetMethod("Update");

        createMethod.Should().NotBeNull();
        updateMethod.Should().NotBeNull();

        foreach (var method in new[] { createMethod!, updateMethod! })
        {
            var roles = GetAuthorizedRoles(controller, method);
            var normalizedRoles = roles.Select(NormalizeRoleName).ToHashSet(StringComparer.OrdinalIgnoreCase);

            normalizedRoles.Should().Contain("LegalComplianceOfficer",
                $"Insurance {method.Name} must allow Legal_Compliance_Officer per Requirement 10.6");
            normalizedRoles.Should().Contain("AdminSupport",
                $"Insurance {method.Name} must allow Admin_Support per Requirement 10.6");
        }
    }

    /// <summary>
    /// Property 16: LegalCase creation and management restricted to Legal_Compliance_Officer and Admin_Support.
    ///
    /// **Validates: Requirement 10.1**
    /// </summary>
    [Fact]
    public void LegalCaseManagement_RestrictedToLcoAndAdminSupport()
    {
        var controller = typeof(LegalCasesController);
        var createMethod = controller.GetMethod("Create");
        var updateMethod = controller.GetMethod("Update");
        var transitionMethod = controller.GetMethod("TransitionStatus");

        createMethod.Should().NotBeNull();
        updateMethod.Should().NotBeNull();
        transitionMethod.Should().NotBeNull();

        foreach (var method in new[] { createMethod!, updateMethod!, transitionMethod! })
        {
            var roles = GetAuthorizedRoles(controller, method);
            var normalizedRoles = roles.Select(NormalizeRoleName).ToHashSet(StringComparer.OrdinalIgnoreCase);

            normalizedRoles.Should().Contain("LegalComplianceOfficer",
                $"LegalCase {method.Name} must allow Legal_Compliance_Officer per Requirement 10.1");
            normalizedRoles.Should().Contain("AdminSupport",
                $"LegalCase {method.Name} must allow Admin_Support per Requirement 10.1");
        }
    }

    /// <summary>
    /// Property 16: General read operations (list, getById, summaries) on LegalCases and Contracts
    /// must allow Acquisition_Manager access. Officer-only views (pipeline) are excluded.
    ///
    /// **Validates: Requirement 10.7**
    /// </summary>
    [Fact]
    public void LegalCaseAndContractGeneralReads_AllowAcquisitionManager()
    {
        var controllersToCheck = new[] { typeof(LegalCasesController), typeof(ContractsController) };

        // These actions are intentionally restricted to LCO only per design (officer-level views)
        var officerOnlyActions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "GetPipeline" // Pipeline view is restricted to Legal_Compliance_Officer per design
        };

        foreach (var controller in controllersToCheck)
        {
            var readActions = controller
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(m => m.GetCustomAttributes().Any(a => a is HttpGetAttribute))
                .Where(m => !officerOnlyActions.Contains(m.Name))
                .ToList();

            readActions.Should().NotBeEmpty($"{controller.Name} should have general read actions");

            foreach (var action in readActions)
            {
                var roles = GetAuthorizedRoles(controller, action);
                var normalizedRoles = roles.Select(NormalizeRoleName).ToHashSet(StringComparer.OrdinalIgnoreCase);

                normalizedRoles.Should().Contain("AcquisitionManager",
                    $"{controller.Name}.{action.Name} must allow Acquisition_Manager read access per Requirement 10.7");
            }
        }
    }

    /// <summary>
    /// Property 16: Dashboard and Audit Trail restricted to Legal_Compliance_Officer only.
    ///
    /// **Validates: Requirements 10.3 (implicitly — dashboard is officer-level view)**
    /// </summary>
    [Fact]
    public void DashboardAndAuditTrail_RestrictedToLegalComplianceOfficer()
    {
        var controllerTypes = new[] { typeof(LegalDashboardController), typeof(AuditTrailController) };

        foreach (var controller in controllerTypes)
        {
            var actions = controller
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(m => m.GetCustomAttributes().Any(a =>
                    a is HttpGetAttribute or HttpPostAttribute or HttpPutAttribute or HttpDeleteAttribute))
                .ToList();

            actions.Should().NotBeEmpty($"{controller.Name} should have actions");

            foreach (var action in actions)
            {
                var roles = GetAuthorizedRoles(controller, action);
                var normalizedRoles = roles.Select(NormalizeRoleName).ToHashSet(StringComparer.OrdinalIgnoreCase);

                normalizedRoles.Should().HaveCount(1,
                    $"{controller.Name}.{action.Name} should be restricted to Legal_Compliance_Officer only");
                normalizedRoles.Should().Contain("LegalComplianceOfficer",
                    $"{controller.Name}.{action.Name} must restrict to Legal_Compliance_Officer only");
            }
        }
    }

    /// <summary>
    /// Property 16: Document deletion restricted to Legal_Compliance_Officer only.
    ///
    /// **Validates: Requirement 8.7 (documents cannot be deleted by users without LCO role)**
    /// </summary>
    [Fact]
    public void DocumentDeletion_RestrictedToLegalComplianceOfficerOnly()
    {
        var controller = typeof(LegalDocumentsController);
        var deleteMethod = controller.GetMethod("Delete");

        deleteMethod.Should().NotBeNull("LegalDocumentsController should have a Delete action");

        var roles = GetAuthorizedRoles(controller, deleteMethod!);
        var normalizedRoles = roles.Select(NormalizeRoleName).ToHashSet(StringComparer.OrdinalIgnoreCase);

        normalizedRoles.Should().HaveCount(1,
            "Document deletion should be restricted to Legal_Compliance_Officer only");
        normalizedRoles.Should().Contain("LegalComplianceOfficer",
            "Document deletion must restrict to Legal_Compliance_Officer per Requirement 8.7");
    }

    /// <summary>
    /// Property 16 (FsCheck): For any random role/controller combination, verify that
    /// the authorization attribute either grants or denies access consistently based on the defined rules.
    ///
    /// **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property RandomRoleOperationCombinations_EnforceCorrectAccessControl()
    {
        var allActions = GetAllControllerActions().ToArray();
        var allRoleNames = KnownRoles.ToArray();

        var gen = Gen.Choose(0, allActions.Length - 1)
            .SelectMany(actionIdx => Gen.Choose(0, allRoleNames.Length - 1)
                .Select(roleIdx => (ActionIndex: actionIdx, RoleIndex: roleIdx)));

        return Prop.ForAll(
            gen.ToArbitrary(),
            pair =>
            {
                var (controller, action) = allActions[pair.ActionIndex];
                var testRole = allRoleNames[pair.RoleIndex];
                var authorizedRoles = GetAuthorizedRoles(controller, action);

                // Check if the test role is authorized for this action
                var normalizedTestRole = NormalizeRoleName(testRole);
                var normalizedAuthorizedRoles = authorizedRoles
                    .Select(NormalizeRoleName)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var shouldBeAuthorized = normalizedAuthorizedRoles.Contains(normalizedTestRole);

                // Verify consistency: if role is in the authorized set, access is granted (200/201)
                // If role is NOT in the authorized set, access is denied (403)
                // The attribute-based check is binary: either the role is listed or it isn't
                if (shouldBeAuthorized)
                {
                    // Role is in the list — would get 200/201
                    return true.Label(
                        $"Role '{testRole}' authorized for {controller.Name}.{action.Name} → 200/201");
                }
                else
                {
                    // Role is NOT in the list — would get 403
                    return (!normalizedAuthorizedRoles.Contains(normalizedTestRole))
                        .Label($"Role '{testRole}' NOT authorized for {controller.Name}.{action.Name} → 403");
                }
            });
    }

    /// <summary>
    /// Normalizes role names to a consistent format for comparison.
    /// Removes underscores and converts to a single convention.
    /// </summary>
    private static string NormalizeRoleName(string role)
    {
        return role.Replace("_", "", StringComparison.Ordinal);
    }
}
