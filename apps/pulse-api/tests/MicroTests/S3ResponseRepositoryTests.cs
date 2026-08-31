using Amazon.S3;
using Amazon.S3.Model;
using System.Text.Json;
using Domain.Responses;
using FluentAssertions;
using Infrastructure;

namespace MicroTests;

public sealed class S3ResponseRepositoryTests
{
    [Theory]
    [InlineData(true, true)]
    [InlineData(false, false)]
    public async Task Save_sets_server_side_encryption_only_when_enabled(
        bool useServerSideEncryption,
        bool expectedEncryption)
    {
        var client = new RecordingS3Client();
        var repository = new S3ResponseRepository(
            client,
            "responses",
            useServerSideEncryption: useServerSideEncryption);

        await repository.SaveAsync(
            new StoredResponse(
                "wave",
                "survey",
                "1.0.0",
                "respondent",
                "1",
                DateTimeOffset.UtcNow,
                "complete",
                JsonDocument.Parse("{}").RootElement.Clone()),
            CancellationToken.None);

        client.Request.Should().NotBeNull();
        (client.Request!.ServerSideEncryptionMethod is not null)
            .Should().Be(expectedEncryption);
        if (expectedEncryption)
        {
            client.Request.ServerSideEncryptionMethod.Should().Be(ServerSideEncryptionMethod.AES256);
        }
    }

    private sealed class RecordingS3Client : AmazonS3Client
    {
        public PutObjectRequest? Request { get; private set; }

        public override Task<PutObjectResponse> PutObjectAsync(
            PutObjectRequest request,
            CancellationToken cancellationToken = default)
        {
            Request = request;
            return Task.FromResult(new PutObjectResponse());
        }
    }
}
