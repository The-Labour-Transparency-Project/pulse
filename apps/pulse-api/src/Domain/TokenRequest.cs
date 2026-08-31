namespace Domain;

public sealed record TokenRequest(string? WaveId, string? SurveyId, string? SurveyVersion, string Email, string? Token = null);
