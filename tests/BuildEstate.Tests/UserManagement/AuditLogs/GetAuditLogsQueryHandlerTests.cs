using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.AuditLogs.Queries.GetAuditLogs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.UserManagement.AuditLogs;

public class GetAuditLogsQueryHandlerTests
{
    private readonly Mock<IAuditLogService> _auditLogServiceMock;
    private readonly Mock<ILogger<GetAuditLogsQueryHandler>> _loggerMock;
    private readonly GetAuditLogsQueryHandler _handler;

    public GetAuditLogsQueryHandlerTests()
    {
        _auditLogServiceMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<GetAuditLogsQueryHandler>>();
        _handler = new GetAuditLogsQueryHandler(
            _auditLogServiceMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ReturnsPaginatedAuditLogs_WithCorrectMapping()
    {
        // Arrange
        var entries = new List<AuditLogEntry>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Timestamp = DateTime.UtcNow.AddHours(-1),
                Action = "UserLogin",
                PerformedByUserId = "user-1",
                PerformedByUserName = "John Smith",
                TargetUserName = null,
                Details = "Successful login",
                IpAddress = "192.168.1.1",
                CorrelationId = Guid.NewGuid().ToString()
            },
            new()
            {
                Id = Guid.NewGuid(),
                Timestamp = DateTime.UtcNow.AddHours(-2),
                Action = "UserDeactivated",
                PerformedByUserId = "admin-1",
                PerformedByUserName = "Admin User",
                TargetUserName = "Jane Doe",
                Details = "Account deactivated by admin",
                IpAddress = "10.0.0.1",
                CorrelationId = Guid.NewGuid().ToString()
            }
        };

        var pagedResult = PagedResult<AuditLogEntry>.Create(entries, 2, 1, 25);

        _auditLogServiceMock
            .Setup(x => x.QueryAsync(It.IsAny<AuditLogQueryParams>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var query = new GetAuditLogsQuery
        {
            Page = 1,
            PageSize = 25
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Entries.Items.Should().HaveCount(2);
        result.IsEmpty.Should().BeFalse();
        result.EmptyStateMessage.Should().BeNull();

        var firstDto = result.Entries.Items[0];
        firstDto.Action.Should().Be("UserLogin");
        firstDto.PerformedByUserName.Should().Be("John Smith");
        firstDto.TargetUserName.Should().BeNull();
        firstDto.IpAddress.Should().Be("192.168.1.1");

        var secondDto = result.Entries.Items[1];
        secondDto.Action.Should().Be("UserDeactivated");
        secondDto.TargetUserName.Should().Be("Jane Doe");
    }

    [Fact]
    public async Task Handle_ReturnsEmptyState_WhenNoRecordsMatch()
    {
        // Arrange
        var pagedResult = PagedResult<AuditLogEntry>.Create(new List<AuditLogEntry>(), 0, 1, 25);

        _auditLogServiceMock
            .Setup(x => x.QueryAsync(It.IsAny<AuditLogQueryParams>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var query = new GetAuditLogsQuery
        {
            Page = 1,
            PageSize = 25,
            ActionType = "NonExistentAction"
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsEmpty.Should().BeTrue();
        result.EmptyStateMessage.Should().Be("No records found for the selected criteria. Try adjusting your filters.");
        result.Entries.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_PassesFiltersCorrectly_ToService()
    {
        // Arrange
        var startDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate = new DateTime(2024, 6, 30, 23, 59, 59, DateTimeKind.Utc);

        var pagedResult = PagedResult<AuditLogEntry>.Create(new List<AuditLogEntry>(), 0, 1, 50);

        AuditLogQueryParams? capturedParams = null;
        _auditLogServiceMock
            .Setup(x => x.QueryAsync(It.IsAny<AuditLogQueryParams>(), It.IsAny<CancellationToken>()))
            .Callback<AuditLogQueryParams, CancellationToken>((p, _) => capturedParams = p)
            .ReturnsAsync(pagedResult);

        var query = new GetAuditLogsQuery
        {
            Page = 2,
            PageSize = 50,
            ActionType = "UserLogin",
            UserId = "user-1",
            DateRangeStart = startDate,
            DateRangeEnd = endDate
        };

        // Act
        await _handler.Handle(query, CancellationToken.None);

        // Assert
        capturedParams.Should().NotBeNull();
        capturedParams!.Page.Should().Be(2);
        capturedParams.PageSize.Should().Be(50);
        capturedParams.ActionType.Should().Be("UserLogin");
        capturedParams.UserId.Should().Be("user-1");
        capturedParams.DateRangeStart.Should().Be(startDate);
        capturedParams.DateRangeEnd.Should().Be(endDate);
    }

    [Fact]
    public async Task Handle_SupportsAllAllowedPageSizes()
    {
        // Arrange
        var pagedResult = PagedResult<AuditLogEntry>.Create(new List<AuditLogEntry>(), 0, 1, 100);

        _auditLogServiceMock
            .Setup(x => x.QueryAsync(It.IsAny<AuditLogQueryParams>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var query = new GetAuditLogsQuery
        {
            Page = 1,
            PageSize = 100
        };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert - no exception thrown for valid page size of 100
        result.Should().NotBeNull();
    }
}
