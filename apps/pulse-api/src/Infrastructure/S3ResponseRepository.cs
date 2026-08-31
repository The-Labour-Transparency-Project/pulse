using System.Text.Json;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Domain.Responses;

namespace Infrastructure;

public sealed class S3ResponseRepository(
    IAmazonS3 s3,
    string bucket,
    string prefix = "responses",
    bool useServerSideEncryption = true) : IResponseRepository
{
    public async Task<SavedResponse> SaveAsync(StoredResponse response, CancellationToken cancellationToken)
    {
        var key = Key(response.SurveyId, response.WaveId, response.RespondentId, response.ResponseVersion);
        var body = JsonSerializer.Serialize(response, JsonOptions.Default);
        try
        {
            var request = new PutObjectRequest
            {
                BucketName = bucket, Key = key, ContentBody = body, ContentType = "application/json",
            };
            if (useServerSideEncryption)
            {
                request.ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256;
            }

            await s3.PutObjectAsync(request, cancellationToken);
        }
        catch (Exception exception) when (exception is AmazonClientException)
        {
            throw S3OperationException.From("PutObject", bucket, exception);
        }
        return new SavedResponse(response.ResponseVersion, response.ReceivedAt);
    }

    public async Task<StoredResponse?> GetLatestAsync(
        string surveyId,
        string waveId,
        string respondentId,
        CancellationToken cancellationToken)
    {
        var request = new ListObjectsV2Request { BucketName = bucket, Prefix = Prefix(surveyId, waveId, respondentId) };
        S3Object? latest = null;
        ListObjectsV2Response result;
        do
        {
            result = await s3.ListObjectsV2Async(request, cancellationToken);
            latest = result.S3Objects.OrderByDescending(x => x.Key)
                .FirstOrDefault(x => latest is null || string.CompareOrdinal(x.Key, latest.Key) > 0) ?? latest;
            request.ContinuationToken = result.NextContinuationToken;
        } while (result.IsTruncated);

        if (latest is null)
        {
            return null;
        }

        using var objectResponse = await s3.GetObjectAsync(bucket, latest.Key, cancellationToken);
        return await JsonSerializer.DeserializeAsync<StoredResponse>(
            objectResponse.ResponseStream,
            JsonOptions.Default,
            cancellationToken);
    }

    private string Prefix(string surveyId, string waveId, string respondentId)
    {
        return $"{prefix.TrimEnd('/')}/{Uri.EscapeDataString(surveyId)}/{Uri.EscapeDataString(waveId)}/{respondentId}/";
    }

    private string Key(string surveyId, string waveId, string respondentId, string version)
    {
        return $"{Prefix(surveyId, waveId, respondentId)}{version}.json";
    }

    private static class JsonOptions
    {
        public static readonly JsonSerializerOptions Default = new(JsonSerializerDefaults.Web);
    }
}
