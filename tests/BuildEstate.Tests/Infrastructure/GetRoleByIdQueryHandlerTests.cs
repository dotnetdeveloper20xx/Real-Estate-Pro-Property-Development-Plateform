using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using BuildEstate.Application.Features.UserManagement.Roles.Queries.GetRoleById;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class GetRoleByIdQueryHandlerTests
{
    private readonly Mock<IRoleQueryService> _roleQueryServiceMock;
    private readonly GetRoleByIdQueryHandler _sut;

    public GetRoleByIdQueryHandlerTests()
    {
        _roleQueryServiceMock = new Mock<IRoleQueryService>();
        _sut = new GetRoleByIdQueryHandler(_roleQueryServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WithExistingRole_ReturnsRoleDetailDto()
    {
        // Arrange
        var roleId = "role-superadmin";
        var expectedRole = new RoleDetailDto
        {
            Id = roleId,
            Name = "SuperAdmin",
            Description = "Full system access with all permissions",
            UserCount = 2,
            IsBuiltIn = true,
            Permissions = new[]
            {
                new PermissionItemDto
                {
                    Id = Guid.NewGuid(),
                    Name = "opportunities.create",
                    DisplayName = "Create Opportunities",
                    DomainArea = "Opportunities"
                },
                new PermissionItemDto
                {
                    Id = Guid.NewGuid(),
                    Name = "finance.view",
                    DisplayName = "View Finance",
                    DomainArea = "Finance"
                }
            }
        };

        _roleQueryServiceMock
            .Setup(s => s.GetRoleByIdAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedRole);

        var query = new GetRoleByIdQuery { RoleId = roleId };

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(roleId);
        result.Name.Should().Be("SuperAdmin");
        result.Description.Should().Be("Full system access with all permissions");
        result.UserCount.Should().Be(2);
        result.IsBuiltIn.Should().BeTrue();
        result.Permissions.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_WithNonExistingRole_ThrowsKeyNotFoundException()
    {
        // Arrange
        var roleId = "non-existent-role";

        _roleQueryServiceMock
            .Setup(s => s.GetRoleByIdAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RoleDetailDto?)null);

        var query = new GetRoleByIdQuery { RoleId = roleId };

        // Act
        var act = async () => await _sut.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"*'{roleId}'*");
    }

    [Fact]
    public async Task Handle_ReturnsRoleWithEmptyPermissions()
    {
        // Arrange
        var roleId = "role-new";
        var expectedRole = new RoleDetailDto
        {
            Id = roleId,
            Name = "NewRole",
            Description = "Freshly created role",
            UserCount = 0,
            IsBuiltIn = false,
            Permissions = []
        };

        _roleQueryServiceMock
            .Setup(s => s.GetRoleByIdAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedRole);

        var query = new GetRoleByIdQuery { RoleId = roleId };

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("NewRole");
        result.IsBuiltIn.Should().BeFalse();
        result.UserCount.Should().Be(0);
        result.Permissions.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_DelegatesToServiceWithCorrectRoleId()
    {
        // Arrange
        var roleId = "role-check";
        var expectedRole = new RoleDetailDto
        {
            Id = roleId,
            Name = "TestRole",
            Description = "Test",
            UserCount = 0,
            IsBuiltIn = false,
            Permissions = []
        };

        _roleQueryServiceMock
            .Setup(s => s.GetRoleByIdAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedRole);

        var query = new GetRoleByIdQuery { RoleId = roleId };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _roleQueryServiceMock.Verify(
            s => s.GetRoleByIdAsync(roleId, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
