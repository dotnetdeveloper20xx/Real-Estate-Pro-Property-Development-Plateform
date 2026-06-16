using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Users.DTOs;
using BuildEstate.Application.Features.UserManagement.Users.Queries.GetUsers;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class GetUsersQueryHandlerTests
{
    private readonly Mock<IUserQueryService> _userQueryServiceMock;
    private readonly GetUsersQueryHandler _sut;

    public GetUsersQueryHandlerTests()
    {
        _userQueryServiceMock = new Mock<IUserQueryService>();
        _sut = new GetUsersQueryHandler(_userQueryServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WithDefaultQuery_ReturnsPagedResult()
    {
        // Arrange
        var expectedItems = new List<UserListItemDto>
        {
            new()
            {
                Id = "user-1",
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@buildestate.com",
                Roles = ["SuperAdmin"],
                IsActive = true,
                LastLoginAt = new DateTime(2024, 1, 15, 10, 30, 0, DateTimeKind.Utc)
            },
            new()
            {
                Id = "user-2",
                FirstName = "Jane",
                LastName = "Smith",
                Email = "jane.smith@buildestate.com",
                Roles = ["ProjectManager", "AcquisitionManager"],
                IsActive = true,
                LastLoginAt = null
            }
        };

        var expectedResult = PagedResult<UserListItemDto>.Create(expectedItems, 2, 1, 10);

        _userQueryServiceMock
            .Setup(s => s.GetUsersAsync(1, 10, null, UserStatusFilter.All, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetUsersQuery();

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);
        result.PageNumber.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task Handle_WithSearchTerm_PassesSearchTermToService()
    {
        // Arrange
        var searchTerm = "john";
        var expectedResult = PagedResult<UserListItemDto>.Create(new List<UserListItemDto>(), 0, 1, 10);

        _userQueryServiceMock
            .Setup(s => s.GetUsersAsync(1, 10, searchTerm, UserStatusFilter.All, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetUsersQuery { SearchTerm = searchTerm };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _userQueryServiceMock.Verify(
            s => s.GetUsersAsync(1, 10, searchTerm, UserStatusFilter.All, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithActiveStatusFilter_PassesFilterToService()
    {
        // Arrange
        var expectedResult = PagedResult<UserListItemDto>.Create(new List<UserListItemDto>(), 0, 1, 25);

        _userQueryServiceMock
            .Setup(s => s.GetUsersAsync(1, 25, null, UserStatusFilter.Active, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetUsersQuery
        {
            PageSize = 25,
            StatusFilter = UserStatusFilter.Active
        };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _userQueryServiceMock.Verify(
            s => s.GetUsersAsync(1, 25, null, UserStatusFilter.Active, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithInactiveStatusFilter_PassesFilterToService()
    {
        // Arrange
        var expectedResult = PagedResult<UserListItemDto>.Create(new List<UserListItemDto>(), 0, 2, 50);

        _userQueryServiceMock
            .Setup(s => s.GetUsersAsync(2, 50, null, UserStatusFilter.Inactive, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetUsersQuery
        {
            Page = 2,
            PageSize = 50,
            StatusFilter = UserStatusFilter.Inactive
        };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _userQueryServiceMock.Verify(
            s => s.GetUsersAsync(2, 50, null, UserStatusFilter.Inactive, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithAllParameters_PassesAllToService()
    {
        // Arrange
        var expectedResult = PagedResult<UserListItemDto>.Create(new List<UserListItemDto>(), 0, 3, 25);

        _userQueryServiceMock
            .Setup(s => s.GetUsersAsync(3, 25, "test", UserStatusFilter.Active, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetUsersQuery
        {
            Page = 3,
            PageSize = 25,
            SearchTerm = "test",
            StatusFilter = UserStatusFilter.Active
        };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _userQueryServiceMock.Verify(
            s => s.GetUsersAsync(3, 25, "test", UserStatusFilter.Active, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ReturnsUserListItemDtoWithCorrectRoles()
    {
        // Arrange
        var userWithRoles = new UserListItemDto
        {
            Id = "user-roles",
            FirstName = "Admin",
            LastName = "User",
            Email = "admin@buildestate.com",
            Roles = ["SuperAdmin", "FinanceDirector", "ProjectManager"],
            IsActive = true,
            LastLoginAt = DateTime.UtcNow
        };

        var expectedResult = PagedResult<UserListItemDto>.Create(
            new List<UserListItemDto> { userWithRoles }, 1, 1, 10);

        _userQueryServiceMock
            .Setup(s => s.GetUsersAsync(1, 10, null, UserStatusFilter.All, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetUsersQuery();

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Items.Should().ContainSingle();
        var item = result.Items[0];
        item.Roles.Should().BeEquivalentTo(["SuperAdmin", "FinanceDirector", "ProjectManager"]);
    }

    [Fact]
    public async Task Handle_EmptyResult_ReturnsEmptyPagedResult()
    {
        // Arrange
        var expectedResult = PagedResult<UserListItemDto>.Create(new List<UserListItemDto>(), 0, 1, 10);

        _userQueryServiceMock
            .Setup(s => s.GetUsersAsync(1, 10, "nonexistent", UserStatusFilter.All, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetUsersQuery { SearchTerm = "nonexistent" };

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
        result.TotalPages.Should().Be(0);
    }
}
