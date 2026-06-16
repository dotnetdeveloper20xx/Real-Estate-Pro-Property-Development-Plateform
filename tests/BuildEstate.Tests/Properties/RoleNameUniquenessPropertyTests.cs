using BuildEstate.Application.Features.UserManagement.Roles.Commands.CreateRole;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Role Name Uniqueness (Property 7).
///
/// Property 7: Role Name Uniqueness Constraint
/// For any role name that already exists in the system, attempting to create a new role
/// with that same name SHALL be rejected with a validation error indicating the name
/// is already in use.
///
/// **Validates: Requirements 8.8**
/// </summary>
public class RoleNameUniquenessPropertyTests
{
    private const string RoleNameAlreadyExistsMessage = "A role with this name already exists.";

    /// <summary>
    /// Creates a validator where the given role name is configured to already exist.
    /// </summary>
    private static CreateRoleCommandValidator CreateValidatorWithExistingRoleName(string existingName)
    {
        var mock = new Mock<IRoleManagementService>();

        // The specific role name already exists
        mock.Setup(x => x.RoleNameExistsAsync(existingName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // All other role names do not exist
        mock.Setup(x => x.RoleNameExistsAsync(It.Is<string>(n => n != existingName), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        return new CreateRoleCommandValidator(mock.Object);
    }

    /// <summary>
    /// Creates a validator where no role names exist in the system.
    /// </summary>
    private static CreateRoleCommandValidator CreateValidatorWithNoExistingRoles()
    {
        var mock = new Mock<IRoleManagementService>();

        mock.Setup(x => x.RoleNameExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        return new CreateRoleCommandValidator(mock.Object);
    }

    /// <summary>
    /// Creates a valid CreateRoleCommand with the specified name.
    /// All other fields satisfy their respective validation rules.
    /// </summary>
    private static CreateRoleCommand CreateValidCommandWithName(string name) => new()
    {
        Name = name,
        Description = "A test role description",
        PermissionIds = [],
        AdminUserId = "admin-001",
        IpAddress = "192.168.1.1",
        CorrelationId = "corr-001"
    };

    /// <summary>
    /// Generator for valid role names (alphanumeric + hyphens, 1-50 chars).
    /// </summary>
    private static Arbitrary<string> ValidRoleNameArbitrary()
    {
        var roleNameGen = from len in Gen.Choose(3, 30)
                          from chars in Gen.ArrayOf(len, Gen.Elements(
                              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-".ToCharArray()))
                          let name = new string(chars)
                          where !name.StartsWith("-") && !name.EndsWith("-")
                          select name;

        return roleNameGen.ToArbitrary();
    }

    #region Property 7.1: Existing role name is rejected with validation error

    /// <summary>
    /// Property 7.1: For any valid role name that already exists in the system,
    /// creating a role with that name SHALL produce a validation error
    /// with message "A role with this name already exists."
    ///
    /// **Validates: Requirements 8.8**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ExistingRoleName_IsRejectedWithUniquenessError()
    {
        return Prop.ForAll(
            ValidRoleNameArbitrary(),
            roleName =>
            {
                // Arrange: configure the role name as already existing
                var validator = CreateValidatorWithExistingRoleName(roleName);
                var command = CreateValidCommandWithName(roleName);

                // Act
                var result = validator.ValidateAsync(command).GetAwaiter().GetResult();

                // Assert: should have the uniqueness error on Name property
                var nameErrors = result.Errors
                    .Where(e => e.PropertyName == "Name")
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return nameErrors.Contains(RoleNameAlreadyExistsMessage)
                    .Label($"Role name '{roleName}' already exists but validator did not produce uniqueness error. Errors: [{string.Join(", ", nameErrors)}]");
            });
    }

    #endregion

    #region Property 7.2: Non-existing role name does not produce uniqueness error

    /// <summary>
    /// Property 7.2: For any valid role name that does NOT exist in the system,
    /// the validator SHALL NOT produce a role name uniqueness error.
    ///
    /// **Validates: Requirements 8.8**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NonExistingRoleName_DoesNotProduceUniquenessError()
    {
        return Prop.ForAll(
            ValidRoleNameArbitrary(),
            roleName =>
            {
                // Arrange: no role names exist in the system
                var validator = CreateValidatorWithNoExistingRoles();
                var command = CreateValidCommandWithName(roleName);

                // Act
                var result = validator.ValidateAsync(command).GetAwaiter().GetResult();

                // Assert: should NOT have the uniqueness error
                var nameUniquenessErrors = result.Errors
                    .Where(e => e.PropertyName == "Name" &&
                                e.ErrorMessage == RoleNameAlreadyExistsMessage)
                    .ToList();

                return (nameUniquenessErrors.Count == 0)
                    .Label($"Role name '{roleName}' does not exist but validator produced uniqueness error");
            });
    }

    #endregion
}
