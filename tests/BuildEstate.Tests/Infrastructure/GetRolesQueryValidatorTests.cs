using BuildEstate.Application.Features.UserManagement.Roles.Queries.GetRoles;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace BuildEstate.Tests.Infrastructure;

public class GetRolesQueryValidatorTests
{
    private readonly GetRolesQueryValidator _sut;

    public GetRolesQueryValidatorTests()
    {
        _sut = new GetRolesQueryValidator();
    }

    [Fact]
    public void Validate_WithDefaultQuery_ShouldNotHaveErrors()
    {
        // Arrange
        var query = new GetRolesQuery();

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(10)]
    [InlineData(25)]
    [InlineData(50)]
    public void Validate_WithValidPageSize_ShouldNotHaveErrors(int pageSize)
    {
        // Arrange
        var query = new GetRolesQuery { PageSize = pageSize };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.PageSize);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    [InlineData(15)]
    [InlineData(100)]
    public void Validate_WithInvalidPageSize_ShouldHaveError(int pageSize)
    {
        // Arrange
        var query = new GetRolesQuery { PageSize = pageSize };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.PageSize)
            .WithErrorMessage("Page size must be 10, 25, or 50.");
    }

    [Fact]
    public void Validate_WithPageLessThan1_ShouldHaveError()
    {
        // Arrange
        var query = new GetRolesQuery { Page = 0 };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Page);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(100)]
    public void Validate_WithValidPage_ShouldNotHaveErrors(int page)
    {
        // Arrange
        var query = new GetRolesQuery { Page = page };

        // Act
        var result = _sut.TestValidate(query);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Page);
    }
}
