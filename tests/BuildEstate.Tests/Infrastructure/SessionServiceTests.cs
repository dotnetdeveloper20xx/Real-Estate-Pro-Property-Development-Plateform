using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class SessionServiceTests : IDisposable
{
    private readonly BuildEstateDbContext _dbContext;
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<ILogger<SessionService>> _loggerMock;
    private readonly SessionService _sut;

    public SessionServiceTests()
    {
        var options = new DbContextOptionsBuilder<BuildEstateDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new BuildEstateDbContext(options);

        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _loggerMock = new Mock<ILogger<SessionService>>();

        _sut = new SessionService(_dbContext, _userManagerMock.Object, _loggerMock.Object);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    #region CreateSessionAsync Tests

    [Fact]
    public async Task CreateSessionAsync_WithValidData_CreatesAndReturnsSession()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var ipAddress = "192.168.1.100";
        var userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

        // Act
        var session = await _sut.CreateSessionAsync(userId, ipAddress, userAgent);

        // Assert
        session.Should().NotBeNull();
        session.UserId.Should().Be(userId);
        session.IpAddress.Should().Be(ipAddress);
        session.DeviceInfo.Should().Be(userAgent);
        session.IsRevoked.Should().BeFalse();
        session.RevokedReason.Should().BeNull();
        session.RevokedAt.Should().BeNull();
    }

    [Fact]
    public async Task CreateSessionAsync_ParsesBrowserFromUserAgent()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

        // Act
        var session = await _sut.CreateSessionAsync(userId, "10.0.0.1", userAgent);

        // Assert
        session.Browser.Should().Be("Chrome 125");
    }

    [Fact]
    public async Task CreateSessionAsync_ParsesOperatingSystemFromUserAgent()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

        // Act
        var session = await _sut.CreateSessionAsync(userId, "10.0.0.1", userAgent);

        // Assert
        session.OperatingSystem.Should().Be("Windows 10");
    }

    [Fact]
    public async Task CreateSessionAsync_SetsGeolocationToNull()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0";

        // Act
        var session = await _sut.CreateSessionAsync(userId, "10.0.0.1", userAgent);

        // Assert
        session.City.Should().BeNull();
        session.Country.Should().BeNull();
    }

    [Fact]
    public async Task CreateSessionAsync_SetsExpiryTo7Days()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var userAgent = "Mozilla/5.0";

        // Act
        var session = await _sut.CreateSessionAsync(userId, "10.0.0.1", userAgent);

        // Assert
        var expectedExpiry = DateTime.UtcNow.AddDays(7);
        session.ExpiresAt.Should().BeCloseTo(expectedExpiry, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task CreateSessionAsync_PersistsSessionToDatabase()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();

        // Act
        var session = await _sut.CreateSessionAsync(userId, "10.0.0.1", "Mozilla/5.0");

        // Assert
        var stored = await _dbContext.UserSessions.FindAsync(session.Id);
        stored.Should().NotBeNull();
        stored!.UserId.Should().Be(userId);
    }

    #endregion

    #region GetActiveSessionsAsync Tests

    [Fact]
    public async Task GetActiveSessionsAsync_ReturnsOnlyActiveNonRevokedSessions()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();

        // Active session
        _dbContext.UserSessions.Add(new UserSession
        {
            UserId = userId,
            IpAddress = "10.0.0.1",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });

        // Revoked session
        _dbContext.UserSessions.Add(new UserSession
        {
            UserId = userId,
            IpAddress = "10.0.0.2",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = true,
            RevokedReason = "Test"
        });

        // Expired session
        _dbContext.UserSessions.Add(new UserSession
        {
            UserId = userId,
            IpAddress = "10.0.0.3",
            ExpiresAt = DateTime.UtcNow.AddHours(-1),
            IsRevoked = false
        });

        await _dbContext.SaveChangesAsync();

        // Act
        var sessions = await _sut.GetActiveSessionsAsync(userId);

        // Assert
        sessions.Should().HaveCount(1);
        sessions[0].IpAddress.Should().Be("10.0.0.1");
    }

    [Fact]
    public async Task GetActiveSessionsAsync_ReturnsSessionsOrderedByLastActiveDescending()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();

        _dbContext.UserSessions.Add(new UserSession
        {
            UserId = userId,
            IpAddress = "10.0.0.1",
            LastActiveAt = DateTime.UtcNow.AddHours(-2),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });

        _dbContext.UserSessions.Add(new UserSession
        {
            UserId = userId,
            IpAddress = "10.0.0.2",
            LastActiveAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });

        await _dbContext.SaveChangesAsync();

        // Act
        var sessions = await _sut.GetActiveSessionsAsync(userId);

        // Assert
        sessions.Should().HaveCount(2);
        sessions[0].IpAddress.Should().Be("10.0.0.2");
        sessions[1].IpAddress.Should().Be("10.0.0.1");
    }

    [Fact]
    public async Task GetActiveSessionsAsync_DoesNotReturnOtherUsersSessions()
    {
        // Arrange
        var userId1 = Guid.NewGuid().ToString();
        var userId2 = Guid.NewGuid().ToString();

        _dbContext.UserSessions.Add(new UserSession
        {
            UserId = userId1,
            IpAddress = "10.0.0.1",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        _dbContext.UserSessions.Add(new UserSession
        {
            UserId = userId2,
            IpAddress = "10.0.0.2",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await _dbContext.SaveChangesAsync();

        // Act
        var sessions = await _sut.GetActiveSessionsAsync(userId1);

        // Assert
        sessions.Should().HaveCount(1);
        sessions[0].UserId.Should().Be(userId1);
    }

    #endregion

    #region RevokeSessionAsync Tests

    [Fact]
    public async Task RevokeSessionAsync_MarksSessionAsRevokedWithReasonAndTimestamp()
    {
        // Arrange
        var session = new UserSession
        {
            UserId = Guid.NewGuid().ToString(),
            IpAddress = "10.0.0.1",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        _dbContext.UserSessions.Add(session);
        await _dbContext.SaveChangesAsync();

        // Act
        await _sut.RevokeSessionAsync(session.Id, "Admin revoked");

        // Assert
        var updated = await _dbContext.UserSessions.FindAsync(session.Id);
        updated!.IsRevoked.Should().BeTrue();
        updated.RevokedReason.Should().Be("Admin revoked");
        updated.RevokedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task RevokeSessionAsync_NonExistentSession_DoesNotThrow()
    {
        // Act
        var act = () => _sut.RevokeSessionAsync(Guid.NewGuid(), "Test");

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task RevokeSessionAsync_AlreadyRevokedSession_IsIdempotent()
    {
        // Arrange
        var session = new UserSession
        {
            UserId = Guid.NewGuid().ToString(),
            IpAddress = "10.0.0.1",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = true,
            RevokedReason = "First revocation",
            RevokedAt = DateTime.UtcNow.AddMinutes(-5)
        };
        _dbContext.UserSessions.Add(session);
        await _dbContext.SaveChangesAsync();

        // Act
        await _sut.RevokeSessionAsync(session.Id, "Second attempt");

        // Assert — should remain unchanged
        var updated = await _dbContext.UserSessions.FindAsync(session.Id);
        updated!.RevokedReason.Should().Be("First revocation");
    }

    #endregion

    #region RevokeAllUserSessionsAsync Tests

    [Fact]
    public async Task RevokeAllUserSessionsAsync_RevokesAllActiveSessionsForUser()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();

        _dbContext.UserSessions.AddRange(
            new UserSession { UserId = userId, IpAddress = "10.0.0.1", ExpiresAt = DateTime.UtcNow.AddDays(7) },
            new UserSession { UserId = userId, IpAddress = "10.0.0.2", ExpiresAt = DateTime.UtcNow.AddDays(7) },
            new UserSession { UserId = userId, IpAddress = "10.0.0.3", ExpiresAt = DateTime.UtcNow.AddDays(7) }
        );
        await _dbContext.SaveChangesAsync();

        // Act
        await _sut.RevokeAllUserSessionsAsync(userId, "Account deactivated");

        // Assert
        var sessions = await _dbContext.UserSessions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        sessions.Should().HaveCount(3);
        sessions.Should().AllSatisfy(s =>
        {
            s.IsRevoked.Should().BeTrue();
            s.RevokedReason.Should().Be("Account deactivated");
            s.RevokedAt.Should().NotBeNull();
        });
    }

    [Fact]
    public async Task RevokeAllUserSessionsAsync_DoesNotAffectOtherUsers()
    {
        // Arrange
        var userId1 = Guid.NewGuid().ToString();
        var userId2 = Guid.NewGuid().ToString();

        _dbContext.UserSessions.AddRange(
            new UserSession { UserId = userId1, IpAddress = "10.0.0.1", ExpiresAt = DateTime.UtcNow.AddDays(7) },
            new UserSession { UserId = userId2, IpAddress = "10.0.0.2", ExpiresAt = DateTime.UtcNow.AddDays(7) }
        );
        await _dbContext.SaveChangesAsync();

        // Act
        await _sut.RevokeAllUserSessionsAsync(userId1, "Password changed");

        // Assert
        var user2Session = await _dbContext.UserSessions
            .FirstAsync(s => s.UserId == userId2);
        user2Session.IsRevoked.Should().BeFalse();
    }

    [Fact]
    public async Task RevokeAllUserSessionsAsync_SkipsAlreadyRevokedSessions()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();

        _dbContext.UserSessions.AddRange(
            new UserSession { UserId = userId, IpAddress = "10.0.0.1", ExpiresAt = DateTime.UtcNow.AddDays(7), IsRevoked = false },
            new UserSession { UserId = userId, IpAddress = "10.0.0.2", ExpiresAt = DateTime.UtcNow.AddDays(7), IsRevoked = true, RevokedReason = "Previous" }
        );
        await _dbContext.SaveChangesAsync();

        // Act
        await _sut.RevokeAllUserSessionsAsync(userId, "New reason");

        // Assert
        var previouslyRevoked = await _dbContext.UserSessions
            .FirstAsync(s => s.UserId == userId && s.IpAddress == "10.0.0.2");
        previouslyRevoked.RevokedReason.Should().Be("Previous"); // Not overwritten
    }

    #endregion

    #region RevokeSessionsForRoleAsync Tests

    [Fact]
    public async Task RevokeSessionsForRoleAsync_RevokesSessionsForAllUsersInRole()
    {
        // Arrange
        var roleId = Guid.NewGuid().ToString();
        var userId1 = Guid.NewGuid().ToString();
        var userId2 = Guid.NewGuid().ToString();

        // Add user-role assignments via Identity's UserRoles table
        _dbContext.UserRoles.AddRange(
            new IdentityUserRole<string> { UserId = userId1, RoleId = roleId },
            new IdentityUserRole<string> { UserId = userId2, RoleId = roleId }
        );

        _dbContext.UserSessions.AddRange(
            new UserSession { UserId = userId1, IpAddress = "10.0.0.1", ExpiresAt = DateTime.UtcNow.AddDays(7) },
            new UserSession { UserId = userId2, IpAddress = "10.0.0.2", ExpiresAt = DateTime.UtcNow.AddDays(7) }
        );
        await _dbContext.SaveChangesAsync();

        // Act
        await _sut.RevokeSessionsForRoleAsync(roleId, "Role permissions changed");

        // Assert
        var allSessions = await _dbContext.UserSessions.ToListAsync();
        allSessions.Should().AllSatisfy(s =>
        {
            s.IsRevoked.Should().BeTrue();
            s.RevokedReason.Should().Be("Role permissions changed");
            s.RevokedAt.Should().NotBeNull();
        });
    }

    [Fact]
    public async Task RevokeSessionsForRoleAsync_DoesNotAffectUsersNotInRole()
    {
        // Arrange
        var roleId = Guid.NewGuid().ToString();
        var userInRole = Guid.NewGuid().ToString();
        var userNotInRole = Guid.NewGuid().ToString();

        _dbContext.UserRoles.Add(
            new IdentityUserRole<string> { UserId = userInRole, RoleId = roleId }
        );

        _dbContext.UserSessions.AddRange(
            new UserSession { UserId = userInRole, IpAddress = "10.0.0.1", ExpiresAt = DateTime.UtcNow.AddDays(7) },
            new UserSession { UserId = userNotInRole, IpAddress = "10.0.0.2", ExpiresAt = DateTime.UtcNow.AddDays(7) }
        );
        await _dbContext.SaveChangesAsync();

        // Act
        await _sut.RevokeSessionsForRoleAsync(roleId, "Role permissions changed");

        // Assert
        var unaffectedSession = await _dbContext.UserSessions
            .FirstAsync(s => s.UserId == userNotInRole);
        unaffectedSession.IsRevoked.Should().BeFalse();
    }

    [Fact]
    public async Task RevokeSessionsForRoleAsync_NoUsersInRole_DoesNotThrow()
    {
        // Arrange
        var roleId = Guid.NewGuid().ToString();

        // Act
        var act = () => _sut.RevokeSessionsForRoleAsync(roleId, "Test");

        // Assert
        await act.Should().NotThrowAsync();
    }

    #endregion

    #region ParseUserAgent Tests

    [Theory]
    [InlineData(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.77 Safari/537.36",
        "Chrome 125", "Windows 10")]
    [InlineData(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Chrome 125", "macOS")]
    [InlineData(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
        "Firefox 126", "Windows 10")]
    [InlineData(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.2535.67",
        "Edge 125", "Windows 10")]
    [InlineData(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.52 Mobile Safari/537.36",
        "Chrome 125", "Android")]
    [InlineData(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        "Safari 17", "iOS")]
    public void ParseUserAgent_ValidUserAgent_ExtractsBrowserAndOS(
        string userAgent, string expectedBrowser, string expectedOs)
    {
        // Act
        var (browser, operatingSystem) = SessionService.ParseUserAgent(userAgent);

        // Assert
        browser.Should().Be(expectedBrowser);
        operatingSystem.Should().Be(expectedOs);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ParseUserAgent_EmptyOrNull_ReturnsUnknown(string? userAgent)
    {
        // Act
        var (browser, operatingSystem) = SessionService.ParseUserAgent(userAgent!);

        // Assert
        browser.Should().Be("Unknown");
        operatingSystem.Should().Be("Unknown");
    }

    [Fact]
    public void ParseUserAgent_UnrecognizedUserAgent_ReturnsUnknown()
    {
        // Arrange
        var userAgent = "SomeCustomBot/1.0";

        // Act
        var (browser, operatingSystem) = SessionService.ParseUserAgent(userAgent);

        // Assert
        browser.Should().Be("Unknown");
        operatingSystem.Should().Be("Unknown");
    }

    #endregion
}
