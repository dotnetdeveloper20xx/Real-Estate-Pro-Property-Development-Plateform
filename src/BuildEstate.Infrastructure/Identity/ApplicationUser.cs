using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace BuildEstate.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    [MaxLength(128)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(128)]
    public string LastName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
