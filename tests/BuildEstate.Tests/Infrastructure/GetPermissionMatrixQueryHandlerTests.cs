using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using BuildEstate.Application.Features.UserManagement.Roles.Queries.GetPermissionMatrix;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class GetPermissionMatrixQueryHandlerTests
{
    private readonly Mock<IRoleQueryService> _roleQueryServiceMock;
    private readonly GetPermissionMatrixQueryHandler _sut;

    public GetPermissionMatrixQueryHandlerTests()
    {
        _roleQueryServiceMock = new Mock<IRoleQueryService>();
        _sut = new GetPermissionMatrixQueryHandler(_roleQueryServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ReturnsPermissionMatrixDto()
    {
        // Arrange
        var permissionId1 = Guid.NewGuid();
        var permissionId2 = Guid.NewGuid();
        var roleId1 = "role-admin";
        var roleId2 = "role-manager";

        var expectedMatrix = new PermissionMatrixDto
        {
            Roles = new[]
            {
                new PermissionMatrixRoleDto { Id = roleId1, Name = "SuperAdmin" },
                new PermissionMatrixRoleDto { Id = roleId2, Name = "ProjectManager" }
            },
            PermissionGroups = new[]
            {
                new PermissionGroupDto
                {
                    DomainArea = "Opportunities",
                    Permissions = new[]
                    {
                        new PermissionItemDto
                        {
                            Id = permissionId1,
                            Name = "opportunities.create",
                            DisplayName = "Create Opportunities",
                            DomainArea = "Opportunities"
                        }
                    }
                },
                new PermissionGroupDto
                {
                    DomainArea = "Finance",
                    Permissions = new[]
                    {
                        new PermissionItemDto
                        {
                            Id = permissionId2,
                            Name = "finance.view",
                            DisplayName = "View Finance",
                            DomainArea = "Finance"
                        }
                    }
                }
            },
            Cells = new[]
            {
                new PermissionMatrixCellDto { RoleId = roleId1, PermissionId = permissionId1, IsGranted = true },
                new PermissionMatrixCellDto { RoleId = roleId1, PermissionId = permissionId2, IsGranted = true },
                new PermissionMatrixCellDto { RoleId = roleId2, PermissionId = permissionId1, IsGranted = true },
                new PermissionMatrixCellDto { RoleId = roleId2, PermissionId = permissionId2, IsGranted = false }
            }
        };

        _roleQueryServiceMock
            .Setup(s => s.GetPermissionMatrixAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedMatrix);

        var query = new GetPermissionMatrixQuery();

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Roles.Should().HaveCount(2);
        result.PermissionGroups.Should().HaveCount(2);
        result.Cells.Should().HaveCount(4);
    }

    [Fact]
    public async Task Handle_PermissionGroupsAreGroupedByDomain()
    {
        // Arrange
        var expectedMatrix = new PermissionMatrixDto
        {
            Roles = new[]
            {
                new PermissionMatrixRoleDto { Id = "role-1", Name = "Admin" }
            },
            PermissionGroups = new[]
            {
                new PermissionGroupDto
                {
                    DomainArea = "Finance",
                    Permissions = new[]
                    {
                        new PermissionItemDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "finance.view",
                            DisplayName = "View Finance",
                            DomainArea = "Finance"
                        },
                        new PermissionItemDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "finance.create",
                            DisplayName = "Create Finance Records",
                            DomainArea = "Finance"
                        }
                    }
                },
                new PermissionGroupDto
                {
                    DomainArea = "Opportunities",
                    Permissions = new[]
                    {
                        new PermissionItemDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "opportunities.view",
                            DisplayName = "View Opportunities",
                            DomainArea = "Opportunities"
                        }
                    }
                }
            },
            Cells = []
        };

        _roleQueryServiceMock
            .Setup(s => s.GetPermissionMatrixAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedMatrix);

        var query = new GetPermissionMatrixQuery();

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.PermissionGroups.Should().HaveCount(2);
        result.PermissionGroups[0].DomainArea.Should().Be("Finance");
        result.PermissionGroups[0].Permissions.Should().HaveCount(2);
        result.PermissionGroups[1].DomainArea.Should().Be("Opportunities");
        result.PermissionGroups[1].Permissions.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_CellsIndicateGrantedAndNotGrantedState()
    {
        // Arrange
        var permId = Guid.NewGuid();
        var roleId = "role-1";

        var expectedMatrix = new PermissionMatrixDto
        {
            Roles = new[] { new PermissionMatrixRoleDto { Id = roleId, Name = "Admin" } },
            PermissionGroups = new[]
            {
                new PermissionGroupDto
                {
                    DomainArea = "Test",
                    Permissions = new[]
                    {
                        new PermissionItemDto
                        {
                            Id = permId,
                            Name = "test.action",
                            DisplayName = "Test Action",
                            DomainArea = "Test"
                        }
                    }
                }
            },
            Cells = new[]
            {
                new PermissionMatrixCellDto { RoleId = roleId, PermissionId = permId, IsGranted = true }
            }
        };

        _roleQueryServiceMock
            .Setup(s => s.GetPermissionMatrixAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedMatrix);

        var query = new GetPermissionMatrixQuery();

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Cells.Should().ContainSingle();
        var cell = result.Cells[0];
        cell.RoleId.Should().Be(roleId);
        cell.PermissionId.Should().Be(permId);
        cell.IsGranted.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_DelegatesToService()
    {
        // Arrange
        var expectedMatrix = new PermissionMatrixDto
        {
            Roles = [],
            PermissionGroups = [],
            Cells = []
        };

        _roleQueryServiceMock
            .Setup(s => s.GetPermissionMatrixAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedMatrix);

        var query = new GetPermissionMatrixQuery();

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _roleQueryServiceMock.Verify(
            s => s.GetPermissionMatrixAsync(It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithEmptySystem_ReturnsEmptyMatrix()
    {
        // Arrange
        var expectedMatrix = new PermissionMatrixDto
        {
            Roles = [],
            PermissionGroups = [],
            Cells = []
        };

        _roleQueryServiceMock
            .Setup(s => s.GetPermissionMatrixAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedMatrix);

        var query = new GetPermissionMatrixQuery();

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Roles.Should().BeEmpty();
        result.PermissionGroups.Should().BeEmpty();
        result.Cells.Should().BeEmpty();
    }
}
