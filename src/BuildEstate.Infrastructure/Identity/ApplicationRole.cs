using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace BuildEstate.Infrastructure.Identity;

public class ApplicationRole : IdentityRole
{
    [MaxLength(256)]
    public string Description { get; set; } = string.Empty;
}
