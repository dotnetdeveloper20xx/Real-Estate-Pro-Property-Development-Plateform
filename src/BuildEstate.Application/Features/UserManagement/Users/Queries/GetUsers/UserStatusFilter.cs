namespace BuildEstate.Application.Features.UserManagement.Users.Queries.GetUsers;

/// <summary>
/// Defines the status filter options for user list queries.
/// </summary>
public enum UserStatusFilter
{
    /// <summary>Show all users regardless of status.</summary>
    All = 0,

    /// <summary>Show only active users.</summary>
    Active = 1,

    /// <summary>Show only inactive (deactivated) users.</summary>
    Inactive = 2
}
