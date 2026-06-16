using BuildEstate.Application.Features.UserManagement.Users.Queries.GetUsers;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace BuildEstate.Tests.Infrastructure;

public class GetUsersQueryValidatorTests
{
    private readonly GetUsersQueryValidator _sut;

    public GetUsersQueryValidatorTests()
    {
        _sut = new GetUsersQueryValidator();
    }

    [Fact]
    public void Validate_WithDefaultQuery_ShouldPass()
    {
        // Arrange
        var query = new GetUsersQuery();

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(10)]
    [InlineData(25)]
    [InlineData(50)]
    public void Validate_WithAllowedPageSize_ShouldPass(int pageSize)
    {
        // Arrange
        var query = new GetUsersQuery { PageSize = pageSize };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.PageSize);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    [InlineData(15)]
    [InlineData(20)]
    [InlineData(30)]
    [InlineData(100)]
    public void Validate_WithInvalidPageSize_ShouldFail(int pageSize)
    {
        // Arrange
        var query = new GetUsersQuery { PageSize = pageSize };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.PageSize)
            .WithErrorMessage("Page size must be 10, 25, or 50.");
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(100)]
    public void Validate_WithValidPage_ShouldPass(int page)
    {
        // Arrange
        var query = new GetUsersQuery { Page = page };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Page);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public void Validate_WithInvalidPage_ShouldFail(int page)
    {
        // Arrange
        var query = new GetUsersQuery { Page = page };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Page)
            .WithErrorMessage("Page number must be at least 1.");
    }

    [Theory]
    [InlineData(UserStatusFilter.All)]
    [InlineData(UserStatusFilter.Active)]
    [InlineData(UserStatusFilter.Inactive)]
    public void Validate_WithValidStatusFilter_ShouldPass(UserStatusFilter filter)
    {
        // Arrange
        var query = new GetUsersQuery { StatusFilter = filter };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.StatusFilter);
    }

    [Fact]
    public void Validate_WithInvalidStatusFilter_ShouldFail()
    {
        // Arrange
        var query = new GetUsersQuery { StatusFilter = (UserStatusFilter)99 };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.StatusFilter);
    }

    [Fact]
    public void Validate_WithSearchTermAndValidParams_ShouldPass()
    {
        // Arrange
        var query = new GetUsersQuery
        {
            Page = 1,
            PageSize = 25,
            SearchTerm = "john doe",
            StatusFilter = UserStatusFilter.Active
        };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }
}
