using System.Text.Json;

namespace Infrastructure;

public sealed class ResponseDocumentValidator(int maximumBytes = 1_048_576)
{
    public int MaximumBytes { get; } = maximumBytes;

    public void Validate(JsonElement document)
    {
        if (document.ValueKind is not JsonValueKind.Object)
        {
            throw new ResponseValidationException("The response document must be a JSON object.");
        }

        var bytes = JsonSerializer.SerializeToUtf8Bytes(document);
        if (bytes.Length > MaximumBytes)
        {
            throw new ResponseValidationException($"The response document exceeds the {MaximumBytes} byte limit.");
        }

        foreach (var property in new[]
                     { "responseSchemaVersion", "submissionId", "waveId", "surveyId", "surveyVersion", "answers", "metadata" })
        {
            if (!document.TryGetProperty(property, out _))
            {
                throw new ResponseValidationException($"The response document is missing '{property}'.");
            }
        }
    }
}
