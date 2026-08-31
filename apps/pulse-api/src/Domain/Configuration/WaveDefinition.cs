namespace Domain.Configuration;

/// <summary>
/// The research and fieldwork profile for one wave. ValidSurveyVersions is a
/// SemVer rule string; interpretation is intentionally deferred for now.
/// </summary>
public sealed record WaveDefinition(
    string WaveId,
    string SurveyId,
    string SurveyVersion,
    string ValidSurveyVersions,
    DateTimeOffset OpensAt,
    DateTimeOffset ClosesAt);
