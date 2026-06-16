using BuildEstate.Application.Features.UserManagement.Roles.Commands.DeleteRole;
using BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRole;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Properties;

/// <summary>
/// Property-based tests for Built-In Role Protection (Property 14).
///
/// Property 14: Built-In Roles Are Protected
/// For any of the 13 built-in roles, verify delete and rename are rejected.
///
/// **Validates: Requirements 8.6**
/// </summary>
public class BuiltInRoleProtectionPropertyTests
{
    private static readonly string[] BuiltInRoleNames =
    [
        "SuperAdmin",
        "AcquisitionManager",
        "LegalOfficer",
        "PlanningManager",
        "ProjectManager",
        "SiteManager",
        "SalesManager",
        "CompletionManager",
        "PropertyManager",
        "FinanceDirector",
        "ValuationAnalyst",
        "Surveyor",
        "Admin"
    ];

    /// <summary>
    /// Creates a DeleteRoleCommandHandler with a mock that marks the role as built-in.
    /// </summary>
    private static (DeleteRoleCommandHandler handler, Mock<IRoleManagementService> roleMock) CreateDeleteHandler(bool isBuiltIn)
    {
        var roleManagementMock = new Mock<IRoleManagementService>();
        var userIdentityMock = new Mock<IUserIdentityService>();
        var auditLogMock = new Mock<IAuditLogService>();
        var loggerMock = new Mock<ILogger<DeleteRoleCommandHandler>>();

        roleManagementMock
            .Setup(x => x.IsBuiltInRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(isBuiltIn);

        roleManagementMock
            .Setup(x => x.GetRoleNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("TestRole");

        roleManagementMock
            .Setup(x => x.GetUserCountForRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        roleManagementMock
            .Setup(x => x.DeleteRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        userIdentityMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        var handler = new DeleteRoleCommandHandler(
            roleManagementMock.Object,
            userIdentityMock.Object,
            auditLogMock.Object,
            loggerMock.Object);

        return (handler, roleManagementMock);
    }

    /// <summary>
    /// Creates an UpdateRoleCommandHandler with a mock that marks the role as built-in.
    /// </summary>
    private static (UpdateRoleCommandHandler handler, Mock<IRoleManagementService> roleMock) CreateUpdateHandler(
        bool isBuiltIn, string currentRoleName)
    {
        var roleManagementMock = new Mock<IRoleManagementService>();
        var userIdentityMock = new Mock<IUserIdentityService>();
        var auditLogMock = new Mock<IAuditLogService>();
        var loggerMock = new Mock<ILogger<UpdateRoleCommandHandler>>();

        roleManagementMock
            .Setup(x => x.IsBuiltInRoleAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(isBuiltIn);

        roleManagementMock
            .Setup(x => x.GetRoleNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentRoleName);

        roleManagementMock
            .Setup(x => x.UpdateRoleAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(IdentityOperationResult.Success());

        userIdentityMock
            .Setup(x => x.GetUserDisplayNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Admin User");

        var handler = new UpdateRoleCommandHandler(
            roleManagementMock.Object,
            userIdentityMock.Object,
            auditLogMock.Object,
            loggerMock.Object);

        return (handler, roleManagementMock);
    }

    /// <summary>
    /// Generator that selects one of the 13 built-in role names.
    /// </summary>
    private static Arbitrary<string> BuiltInRoleNameArbitrary()
    {
        var gen = Gen.Elements(BuiltInRoleNames);
        return gen.ToArbitrary();
    }

    /// <summary>
    /// Generator for new role names that differ from a given current name.
    /// </summary>
    private static Arbitrary<string> DifferentRoleNameArbitrary()
    {
        var gen = from len in Gen.Choose(3, 20)
                  from chars in Gen.ArrayOf(len, Gen.Elements(
                      "abcdefghijklmnopqrstuvwxyz0123456789".ToCharArray()))
                  select "renamed-" + new string(chars);
        return gen.ToArbitrary();
    }

    #region Property 14.1: Built-in roles cannot be deleted

    /// <summary>
    /// Property 14.1: For any of the 13 built-in roles, verify delete is rejected.
    ///
    /// **Validates: Requirements 8.6**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property BuiltInRole_DeleteIsRejected()
    {
        return Prop.ForAll(
            BuiltInRoleNameArbitrary(),
            builtInRoleName =>
            {
                // Arrange
                var (handler, _) = CreateDeleteHandler(isBuiltIn: true);
                var command = new DeleteRoleCommand
                {
                    RoleId = Guid.NewGuid().ToString(),
                    ConfirmDeletion = true,
                    AdminUserId = "admin-001",
                    IpAddress = "192.168.1.1",
                    CorrelationId = "corr-001"
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                return (!result.Succeeded &&
                        result.Errors.Any(e => e.Contains("Built-in roles cannot be deleted")))
                    .Label($"Built-in role '{builtInRoleName}' should not be deletable but was allowed");
            });
    }

    #endregion

    #region Property 14.2: Built-in roles cannot be renamed

    /// <summary>
    /// Property 14.2: For any of the 13 built-in roles, verify rename is rejected.
    ///
    /// **Validates: Requirements 8.6**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property BuiltInRole_RenameIsRejected()
    {
        return Prop.ForAll(
            BuiltInRoleNameArbitrary(),
            DifferentRoleNameArbitrary(),
            (builtInRoleName, newName) =>
            {
                // Arrange: role is built-in and current name is the built-in name
                var (handler, _) = CreateUpdateHandler(isBuiltIn: true, currentRoleName: builtInRoleName);
                var command = new UpdateRoleCommand
                {
                    RoleId = Guid.NewGuid().ToString(),
                    Name = newName, // Attempting to rename
                    Description = "Updated description",
                    AdminUserId = "admin-001",
                    IpAddress = "192.168.1.1",
                    CorrelationId = "corr-001"
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                return (!result.Succeeded &&
                        result.Errors.Any(e => e.Contains("Built-in roles cannot be renamed")))
                    .Label($"Built-in role '{builtInRoleName}' should not be renamable to '{newName}' but was allowed");
            });
    }

    #endregion

    #region Property 14.3: Non-built-in roles can be deleted

    /// <summary>
    /// Property 14.3: For any non-built-in role, verify delete is allowed (when no blocking conditions exist).
    /// </summary>
    [Property(MaxTest = 30)]
    public Property NonBuiltInRole_DeleteIsAllowed()
    {
        return Prop.ForAll(
            DifferentRoleNameArbitrary(),
            roleName =>
            {
                // Arrange: role is NOT built-in
                var (handler, _) = CreateDeleteHandler(isBuiltIn: false);
                var command = new DeleteRoleCommand
                {
                    RoleId = Guid.NewGuid().ToString(),
                    ConfirmDeletion = true,
                    AdminUserId = "admin-001",
                    IpAddress = "192.168.1.1",
                    CorrelationId = "corr-001"
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                return result.Succeeded
                    .Label($"Non-built-in role '{roleName}' should be deletable but was rejected");
            });
    }

    #endregion
}
