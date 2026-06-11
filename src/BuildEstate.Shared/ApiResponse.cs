using System.Text.Json.Serialization;

namespace BuildEstate.Shared;

/// <summary>
/// Standard API response envelope for consistent frontend contract.
/// </summary>
/// <typeparam name="T">The type of data returned in the response.</typeparam>
public class ApiResponse<T>
{
    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("errors")]
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Creates a successful response with the provided data.
    /// </summary>
    public static ApiResponse<T> SuccessResult(T data)
        => new() { Data = data, Success = true, Errors = new() };

    /// <summary>
    /// Creates a failure response with the provided error messages.
    /// </summary>
    public static ApiResponse<T> FailureResult(List<string> errors)
        => new() { Data = default, Success = false, Errors = errors };
}
