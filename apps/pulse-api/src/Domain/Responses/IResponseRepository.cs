namespace Domain.Responses;

public interface IResponseRepository
{
    Task<SavedResponse> SaveAsync(StoredResponse response, CancellationToken cancellationToken);
    Task<StoredResponse?> GetLatestAsync(string surveyId, string waveId, string respondentId, CancellationToken cancellationToken);
}
