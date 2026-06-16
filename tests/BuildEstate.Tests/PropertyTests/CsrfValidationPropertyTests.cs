using System.Security.Claims;
using BuildEstate.API.Middleware;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for CSRF Validation Middleware.
/// 
/// **Validates: Requirements 19.4, 19.5**
/// 
/// Property 16: CSRF Validation Rejects Invalid Tokens — for any state-changing request
/// (POST, PUT, PATCH, DELETE) from an authenticated user that is missing or presenting
/// an invalid CSRF token, the middleware SHALL reject the request with 403 Forbidden
/// and the operation SHALL NOT be processed.
/// </summary>
public class CsrfValidationPropertyTests
{
    private static readonly string[] StateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
    private static readonly string[] NonExemptPaths = ["/api/v1/users", "/api/v1/roles", "/api/v1/admin/users", "/api/v1/sessions/revoke"];

    #region Helpers

    private static CsrfValidationMiddleware CreateMiddleware(RequestDelegate next)
    {
        var loggerMock = new Mock<ILogger<CsrfValidationMiddleware>>();
        return new CsrfValidationMiddleware(next, loggerMock.Object);
    }

    private static HttpContext CreateAuthenticatedContext(string method, string path, string? headerToken, string? cookieToken)
    {
        var context = new DefaultHttpContext();
        context.Request.Method = method;
        context.Request.Path = path;

        // Set up authenticated user
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
            new Claim(ClaimTypes.Email, "test@example.com"),
            new Claim(ClaimTypes.Role, "SuperAdmin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        context.User = new ClaimsPrincipal(identity);

        // Set CSRF header if provided
        if (headerToken is not null)
        {
            context.Request.Headers[CsrfValidationMiddleware.CsrfHeaderName] = headerToken;
        }

        // Set CSRF cookie if provided
        if (cookieToken is not null)
        {
            // DefaultHttpContext doesn't support cookies directly, so we use a custom implementation
            context.Request.Headers["Cookie"] = $"{CsrfValidationMiddleware.CsrfCookieName}={cookieToken}";
            // Need to set up the cookie container properly
            var requestCookies = new MockRequestCookieCollection(
                cookieToken is not null
                    ? new Dictionary<string, string> { [CsrfValidationMiddleware.CsrfCookieName] = cookieToken }
                    : new Dictionary<string, string>());
            context.Features.Set<IRequestCookiesFeature>(new MockRequestCookiesFeature(requestCookies));
        }
        else
        {
            context.Features.Set<IRequestCookiesFeature>(new MockRequestCookiesFeature(
                new MockRequestCookieCollection(new Dictionary<string, string>())));
        }

        return context;
    }

    #endregion

    #region Property 16: Missing CSRF Token Rejection

    /// <summary>
    /// Property 16: CSRF Validation — Missing Token
    /// For any state-changing method and any non-exempt path, when the CSRF header token
    /// is missing (but cookie is present), the request SHALL be rejected with 403.
    /// **Validates: Requirements 19.4, 19.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Csrf_MissingHeaderToken_Rejects_ForAnyStateChangingMethod()
    {
        var methodGen = Gen.Elements(StateChangingMethods);
        var pathGen = Gen.Elements(NonExemptPaths);
        var cookieTokenGen = Gen.Elements("valid-token-123", "abc-def-ghi", "token-xyz-999");

        var inputGen = from method in methodGen
                       from path in pathGen
                       from cookie in cookieTokenGen
                       select (Method: method, Path: path, CookieToken: cookie);

        return Prop.ForAll(inputGen.ToArbitrary(), async input =>
        {
            var wasCalled = false;
            var middleware = CreateMiddleware(_ =>
            {
                wasCalled = true;
                return Task.CompletedTask;
            });

            var context = CreateAuthenticatedContext(input.Method, input.Path, headerToken: null, cookieToken: input.CookieToken);

            await middleware.InvokeAsync(context);

            context.Response.StatusCode.Should().Be(403,
                because: $"request with method '{input.Method}' to '{input.Path}' without CSRF header should be rejected");
            wasCalled.Should().BeFalse(
                because: "the next middleware (operation) should NOT be invoked when CSRF validation fails");
        });
    }

    /// <summary>
    /// Property 16: CSRF Validation — Missing Cookie Token
    /// For any state-changing method and any non-exempt path, when the CSRF cookie
    /// is missing (but header is present), the request SHALL be rejected with 403.
    /// **Validates: Requirements 19.4, 19.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Csrf_MissingCookieToken_Rejects_ForAnyStateChangingMethod()
    {
        var methodGen = Gen.Elements(StateChangingMethods);
        var pathGen = Gen.Elements(NonExemptPaths);
        var headerTokenGen = Gen.Elements("valid-token-123", "abc-def-ghi", "token-xyz-999");

        var inputGen = from method in methodGen
                       from path in pathGen
                       from header in headerTokenGen
                       select (Method: method, Path: path, HeaderToken: header);

        return Prop.ForAll(inputGen.ToArbitrary(), async input =>
        {
            var wasCalled = false;
            var middleware = CreateMiddleware(_ =>
            {
                wasCalled = true;
                return Task.CompletedTask;
            });

            var context = CreateAuthenticatedContext(input.Method, input.Path, headerToken: input.HeaderToken, cookieToken: null);

            await middleware.InvokeAsync(context);

            context.Response.StatusCode.Should().Be(403,
                because: $"request with method '{input.Method}' to '{input.Path}' without CSRF cookie should be rejected");
            wasCalled.Should().BeFalse(
                because: "the next middleware (operation) should NOT be invoked when CSRF validation fails");
        });
    }

    #endregion

    #region Property 16: Invalid (Mismatched) CSRF Token Rejection

    /// <summary>
    /// Property 16: CSRF Validation — Mismatched Tokens
    /// For any state-changing method and any non-exempt path, when the header token
    /// does NOT match the cookie token, the request SHALL be rejected with 403.
    /// **Validates: Requirements 19.4, 19.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Csrf_MismatchedTokens_Rejects_ForAnyStateChangingMethod()
    {
        var methodGen = Gen.Elements(StateChangingMethods);
        var pathGen = Gen.Elements(NonExemptPaths);
        // Generate two different tokens to ensure mismatch
        var tokenGen = from t1 in Arb.Generate<NonEmptyString>()
                       from t2 in Arb.Generate<NonEmptyString>()
                       where t1.Get != t2.Get
                       select (Header: t1.Get, Cookie: t2.Get);

        var inputGen = from method in methodGen
                       from path in pathGen
                       from tokens in tokenGen
                       select (Method: method, Path: path, HeaderToken: tokens.Header, CookieToken: tokens.Cookie);

        return Prop.ForAll(inputGen.ToArbitrary(), async input =>
        {
            var wasCalled = false;
            var middleware = CreateMiddleware(_ =>
            {
                wasCalled = true;
                return Task.CompletedTask;
            });

            var context = CreateAuthenticatedContext(
                input.Method, input.Path,
                headerToken: input.HeaderToken,
                cookieToken: input.CookieToken);

            await middleware.InvokeAsync(context);

            context.Response.StatusCode.Should().Be(403,
                because: $"request with method '{input.Method}' to '{input.Path}' with mismatched CSRF tokens should be rejected");
            wasCalled.Should().BeFalse(
                because: "the next middleware (operation) should NOT be invoked when CSRF tokens don't match");
        });
    }

    #endregion

    #region Property 16: Valid CSRF Token Passes

    /// <summary>
    /// Property 16: CSRF Validation — Valid Matching Tokens
    /// For any state-changing method and any non-exempt path, when the header token
    /// matches the cookie token, the request SHALL be allowed through.
    /// **Validates: Requirements 19.4, 19.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Csrf_MatchingTokens_Allows_ForAnyStateChangingMethod()
    {
        var methodGen = Gen.Elements(StateChangingMethods);
        var pathGen = Gen.Elements(NonExemptPaths);
        var tokenGen = from t in Arb.Generate<NonEmptyString>()
                       where t.Get.Length > 0
                       select t.Get;

        var inputGen = from method in methodGen
                       from path in pathGen
                       from token in tokenGen
                       select (Method: method, Path: path, Token: token);

        return Prop.ForAll(inputGen.ToArbitrary(), async input =>
        {
            var wasCalled = false;
            var middleware = CreateMiddleware(_ =>
            {
                wasCalled = true;
                return Task.CompletedTask;
            });

            var context = CreateAuthenticatedContext(
                input.Method, input.Path,
                headerToken: input.Token,
                cookieToken: input.Token);

            await middleware.InvokeAsync(context);

            wasCalled.Should().BeTrue(
                because: $"request with method '{input.Method}' to '{input.Path}' with valid CSRF tokens should be allowed");
            context.Response.StatusCode.Should().NotBe(403,
                because: "valid CSRF tokens should not trigger rejection");
        });
    }

    #endregion

    #region Property 16: Exempt Paths Bypass Validation

    /// <summary>
    /// Property 16: CSRF Validation — Exempt Paths
    /// For any state-changing method targeting an exempt path (login, refresh),
    /// the request SHALL be allowed through even without CSRF tokens.
    /// **Validates: Requirements 19.4, 19.5**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property Csrf_ExemptPaths_Bypass_ForAnyStateChangingMethod()
    {
        var methodGen = Gen.Elements(StateChangingMethods);
        var exemptPathGen = Gen.Elements("/api/v1/auth/login", "/api/v1/auth/refresh", "/health");

        var inputGen = from method in methodGen
                       from path in exemptPathGen
                       select (Method: method, Path: path);

        return Prop.ForAll(inputGen.ToArbitrary(), async input =>
        {
            var wasCalled = false;
            var middleware = CreateMiddleware(_ =>
            {
                wasCalled = true;
                return Task.CompletedTask;
            });

            var context = CreateAuthenticatedContext(
                input.Method, input.Path,
                headerToken: null,
                cookieToken: null);

            await middleware.InvokeAsync(context);

            wasCalled.Should().BeTrue(
                because: $"exempt path '{input.Path}' should bypass CSRF validation regardless of method '{input.Method}'");
        });
    }

    #endregion

    #region Mock Cookie Helpers

    /// <summary>
    /// Simple mock implementation of IRequestCookieCollection for testing.
    /// </summary>
    private class MockRequestCookieCollection : IRequestCookieCollection
    {
        private readonly Dictionary<string, string> _cookies;

        public MockRequestCookieCollection(Dictionary<string, string> cookies)
        {
            _cookies = cookies;
        }

        public string? this[string key] => _cookies.TryGetValue(key, out var value) ? value : null;
        public int Count => _cookies.Count;
        public ICollection<string> Keys => _cookies.Keys;
        public bool ContainsKey(string key) => _cookies.ContainsKey(key);
        public bool TryGetValue(string key, out string? value)
        {
            var result = _cookies.TryGetValue(key, out var v);
            value = v;
            return result;
        }

        public IEnumerator<KeyValuePair<string, string>> GetEnumerator() => _cookies.GetEnumerator();
        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();
    }

    /// <summary>
    /// Mock feature for request cookies.
    /// </summary>
    private class MockRequestCookiesFeature : IRequestCookiesFeature
    {
        public MockRequestCookiesFeature(IRequestCookieCollection cookies)
        {
            Cookies = cookies;
        }

        public IRequestCookieCollection Cookies { get; set; }
    }

    #endregion
}
