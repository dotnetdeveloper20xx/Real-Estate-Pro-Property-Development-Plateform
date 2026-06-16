using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using BuildEstate.Application.Features.UserManagement.Authentication.Queries.GetCurrentUser;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Exceptions;
using FluentAssertions;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class GetCurrentUserQueryHandlerTests
{
    private readonly Mock<IUserIdentityService> _userIdentityServiceMock;
    private readonly GetCurrentUserQueryHandler _sut;

    public GetCurrentUserQueryHandlerTests()
    {
        _userIdentityServiceMock = new Mock<IUserIdentityService>();
        _sut = new GetCurrentUserQueryHandler(_userIdentityServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WithValidUserId_ReturnsCurrentUserDto()
    {
        // Arrange
        var userId = "user-123";
        var expectedDto = new CurrentUserDto
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@buildestate.com",
            Roles = ["SuperAdmin", "ProjectManager"],
            Permissions = ["opportunities.create", "opportunities.view", "projects.manage"]
        };

        _userIdentityServiceMock
            .Setup(s => s.GetCurrentUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var query = new GetCurrentUserQuery { UserId = userId };

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(userId);
        result.FirstName.Should().Be("John");
        result.LastName.Should().Be("Doe");
        result.Email.Should().Be("john.doe@buildestate.com");
        result.Roles.Should().BeEquivalentTo(["SuperAdmin", "ProjectManager"]);
        result.Permissions.Should().BeEquivalentTo(["opportunities.create", "opportunities.view", "projects.manage"]);
    }

    [Fact]
    public async Task Handle_WithNonExistentUserId_ThrowsEntityNotFoundException()
    {
        // Arrange
        var userId = "non-existent-user";

        _userIdentityServiceMock
            .Setup(s => s.GetCurrentUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CurrentUserDto?)null);

        var query = new GetCurrentUserQuery { UserId = userId };

        // Act
        var act = () => _sut.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<EntityNotFoundException>()
            .Where(ex => ex.EntityType == "User" && ex.EntityId == userId);
    }

    [Fact]
    public async Task Handle_WithUserHavingNoRoles_ReturnsEmptyRolesAndPermissions()
    {
        // Arrange
        var userId = "user-no-roles";
        var expectedDto = new CurrentUserDto
        {
            Id = userId,
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane.smith@buildestate.com",
            Roles = [],
            Permissions = []
        };

        _userIdentityServiceMock
            .Setup(s => s.GetCurrentUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var query = new GetCurrentUserQuery { UserId = userId };

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(userId);
        result.Roles.Should().BeEmpty();
        result.Permissions.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_CallsUserIdentityServiceWithCorrectUserId()
    {
        // Arrange
        var userId = "user-verify-call";
        var expectedDto = new CurrentUserDto
        {
            Id = userId,
            FirstName = "Test",
            LastName = "User",
            Email = "test@buildestate.com",
            Roles = ["Admin"],
            Permissions = ["admin.access"]
        };

        _userIdentityServiceMock
            .Setup(s => s.GetCurrentUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDto);

        var query = new GetCurrentUserQuery { UserId = userId };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _userIdentityServiceMock.Verify(
            s => s.GetCurrentUserAsync(userId, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
