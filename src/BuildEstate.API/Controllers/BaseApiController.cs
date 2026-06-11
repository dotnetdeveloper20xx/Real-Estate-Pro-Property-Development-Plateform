using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers;

/// <summary>
/// Abstract base controller providing MediatR integration, API versioning route template,
/// and authorization enforcement for all derived controllers.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;

    /// <summary>
    /// Provides access to the MediatR sender for dispatching commands and queries.
    /// Lazily resolved from the request services to avoid constructor injection overhead
    /// in derived controllers that may not always need it immediately.
    /// </summary>
    protected ISender Mediator =>
        _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();
}
