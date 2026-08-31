using System.Text.Json;
using Infrastructure;

namespace MicroTests;

public class ResponseValidationTests
{
    private static JsonElement Document(string json)
    {
        return JsonDocument.Parse(json).RootElement.Clone();
    }

    [Fact]
    public void Existing_response_contract_is_accepted()
    {
        var document = Document(
            "{\"responseSchemaVersion\":\"1.0.0\",\"submissionId\":\"00000000-0000-0000-0000-000000000000\",\"waveId\":\"pulse-2026\",\"surveyId\":\"ltp.supply-chain-confidence\",\"surveyVersion\":\"1.0.2\",\"answers\":[],\"metadata\":[]}");
        new ResponseDocumentValidator().Validate(document);
    }

    [Fact]
    public void Malformed_shape_and_oversized_documents_are_rejected()
    {
        Assert.Throws<ResponseValidationException>(() => new ResponseDocumentValidator().Validate(Document("[]")));
        Assert.Throws<ResponseValidationException>(() =>
            new ResponseDocumentValidator().Validate(Document("{\"surveyId\":\"pulse-2026\"}")));
        Assert.Throws<ResponseValidationException>(() => new ResponseDocumentValidator(10).Validate(
            Document(
                "{\"responseSchemaVersion\":\"1.0.0\",\"submissionId\":\"00000000-0000-0000-0000-000000000000\",\"waveId\":\"pulse-2026\",\"surveyId\":\"ltp.supply-chain-confidence\",\"surveyVersion\":\"1.0.2\",\"answers\":[],\"metadata\":[],\"extra\":\"large\"}")));
    }
}
