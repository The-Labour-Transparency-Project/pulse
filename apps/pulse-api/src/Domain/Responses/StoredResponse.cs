using System.Text.Json;

namespace Domain.Responses;

public sealed record StoredResponse(
    string WaveId,
    string SurveyId,
    string SurveyVersion,
    string RespondentId,
    string ResponseVersion,
    DateTimeOffset ReceivedAt,
    string ResponseSchemaVersion,
    JsonElement Response);
