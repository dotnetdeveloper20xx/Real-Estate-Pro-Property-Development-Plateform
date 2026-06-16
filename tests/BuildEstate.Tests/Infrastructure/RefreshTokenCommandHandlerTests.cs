using BuildEstate.Application.Features.UserManagement.Authentication.Commands.RefreshToken;
using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using BuildEstate.Application.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.Infrastructure;

public class RefreshTokenCommandHandlerTests
{
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<ILogger<RefreshTokenCommandHandler>> _loggerMock;
    private readonly RefreshTokenCommandHandler _sut;

    public RefreshTokenCommandHandlerTests()
    {
        _tokenServiceMock = new Mock<ITokenService>();
        _loggerMock = new Mock<ILogger<RefreshTokenCommandHandler>>();

        _sut = new RefreshTokenCommandHandler(
            _tokenServiceMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_WithValidRefreshToken_ReturnsNewTokenPair()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-refresh-token-abc123",
            IpAddress = "192.168.1.100",
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        };

        var expectedAccessToken = "new-access-token-xyz";
        var expectedRefreshToken = "new-refresh-token-xyz";

        _tokenServiceMock
            .Setup(ts => ts.RefreshTokenAsync(
                command.RefreshToken,
                command.IpAddress,
                command.UserAgent,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((expectedAccessToken, expectedRefreshToken));

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be(expectedAccessToken);
        result.RefreshToken.Should().Be(expectedRefreshToken);
    }

    [Fact]
    public async Task Handle_WithValidRefreshToken_CallsTokenServiceWithCorrectParameters()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "my-refresh-token",
            IpAddress = "10.0.0.1",
            UserAgent = "TestAgent/1.0"
        };

        _tokenServiceMock
            .Setup(ts => ts.RefreshTokenAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(("access-token", "refresh-token"));

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        _tokenServiceMock.Verify(
            ts => ts.RefreshTokenAsync(
                "my-refresh-token",
                "10.0.0.1",
                "TestAgent/1.0",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenTokenServiceThrowsForInvalidToken_PropagatesException()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "invalid-token",
            IpAddress = "192.168.1.50",
            UserAgent = "Mozilla/5.0"
        };

        _tokenServiceMock
            .Setup(ts => ts.RefreshTokenAsync(
                command.RefreshToken,
                command.IpAddress,
                command.UserAgent,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Invalid refresh token."));

        // Act
        var act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid refresh token.");
    }

    [Fact]
    public async Task Handle_WhenTokenServiceThrowsForExpiredToken_PropagatesException()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "expired-token",
            IpAddress = "172.16.0.1",
            UserAgent = "Chrome/120.0"
        };

        _tokenServiceMock
            .Setup(ts => ts.RefreshTokenAsync(
                command.RefreshToken,
                command.IpAddress,
                command.UserAgent,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Refresh token has expired."));

        // Act
        var act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Refresh token has expired.");
    }

    [Fact]
    public async Task Handle_WhenTokenServiceThrowsForRevokedToken_PropagatesException()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "revoked-token",
            IpAddress = "10.10.10.10",
            UserAgent = "Safari/17.0"
        };

        _tokenServiceMock
            .Setup(ts => ts.RefreshTokenAsync(
                command.RefreshToken,
                command.IpAddress,
                command.UserAgent,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Refresh token has been revoked."));

        // Act
        var act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Refresh token has been revoked.");
    }

    [Fact]
    public async Task Handle_WhenTokenReusedBeyondGracePeriod_PropagatesException()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "already-used-token",
            IpAddress = "192.168.0.5",
            UserAgent = "Edge/120.0"
        };

        _tokenServiceMock
            .Setup(ts => ts.RefreshTokenAsync(
                command.RefreshToken,
                command.IpAddress,
                command.UserAgent,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException(
                "Refresh token has already been consumed. All tokens have been revoked for security."));

        // Act
        var act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already been consumed*");
    }

    [Fact]
    public async Task Handle_ReturnsTokenResultDtoType()
    {
        // Arrange
        var command = new RefreshTokenCommand
        {
            RefreshToken = "valid-token",
            IpAddress = "127.0.0.1",
            UserAgent = "Test/1.0"
        };

        _tokenServiceMock
            .Setup(ts => ts.RefreshTokenAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(("access", "refresh"));

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeOfType<TokenResultDto>();
    }
}
