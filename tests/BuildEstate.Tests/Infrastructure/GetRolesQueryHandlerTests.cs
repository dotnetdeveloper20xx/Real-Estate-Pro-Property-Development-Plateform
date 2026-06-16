using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using BuildEstate.Application.Features.UserManagement.Roles.Queries.GetRoles;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class GetRolesQueryHandlerTests
{
    private readonly Mock<IRoleQueryService> _roleQueryServiceMock;
    private readonly GetRolesQueryHandler _sut;

    public GetRolesQueryHandlerTests()
    {
        _roleQueryServiceMock = new Mock<IRoleQueryService>();
        _sut = new GetRolesQueryHandler(_roleQueryServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WithDefaultQuery_ReturnsPagedResult()
    {
        // Arrange
        var expectedItems = new List<RoleListItemDto>
        {
            new()
            {
                Id = "role-1",
                Name = "SuperAdmin",
                Description = "Full system access",
                UserCount = 3,
                IsBuiltIn = true
            },
            new()
            {
                Id = "role-2",
                Name = "ProjectManager",
                Description = "Manages projects",
                UserCount = 5,
                IsBuiltIn = true
            }
        };

        var expectedResult = PagedResult<RoleListItemDto>.Create(expectedItems, 2, 1, 10);

        _roleQueryServiceMock
            .Setup(s => s.GetRolesAsync(1, 10, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetRolesQuery();

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
        var searchTerm = "admin";
        var expectedResult = PagedResult<RoleListItemDto>.Create(new List<RoleListItemDto>(), 0, 1, 10);

        _roleQueryServiceMock
            .Setup(s => s.GetRolesAsync(1, 10, searchTerm, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetRolesQuery { SearchTerm = searchTerm };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _roleQueryServiceMock.Verify(
            s => s.GetRolesAsync(1, 10, searchTerm, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithPagination_PassesPaginationToService()
    {
        // Arrange
        var expectedResult = PagedResult<RoleListItemDto>.Create(new List<RoleListItemDto>(), 0, 2, 25);

        _roleQueryServiceMock
            .Setup(s => s.GetRolesAsync(2, 25, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetRolesQuery { Page = 2, PageSize = 25 };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _roleQueryServiceMock.Verify(
            s => s.GetRolesAsync(2, 25, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithAllParameters_PassesAllToService()
    {
        // Arrange
        var expectedResult = PagedResult<RoleListItemDto>.Create(new List<RoleListItemDto>(), 0, 3, 50);

        _roleQueryServiceMock
            .Setup(s => s.GetRolesAsync(3, 50, "manager", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetRolesQuery
        {
            Page = 3,
            PageSize = 50,
            SearchTerm = "manager"
        };

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        _roleQueryServiceMock.Verify(
            s => s.GetRolesAsync(3, 50, "manager", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ReturnsRoleListItemDtoWithCorrectUserCount()
    {
        // Arrange
        var roleWithUsers = new RoleListItemDto
        {
            Id = "role-admin",
            Name = "Admin",
            Description = "Administrative access",
            UserCount = 12,
            IsBuiltIn = true
        };

        var expectedResult = PagedResult<RoleListItemDto>.Create(
            new List<RoleListItemDto> { roleWithUsers }, 1, 1, 10);

        _roleQueryServiceMock
            .Setup(s => s.GetRolesAsync(1, 10, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetRolesQuery();

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Items.Should().ContainSingle();
        var item = result.Items[0];
        item.UserCount.Should().Be(12);
        item.IsBuiltIn.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_EmptyResult_ReturnsEmptyPagedResult()
    {
        // Arrange
        var expectedResult = PagedResult<RoleListItemDto>.Create(new List<RoleListItemDto>(), 0, 1, 10);

        _roleQueryServiceMock
            .Setup(s => s.GetRolesAsync(1, 10, "nonexistent", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        var query = new GetRolesQuery { SearchTerm = "nonexistent" };

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
        result.TotalPages.Should().Be(0);
    }
}
