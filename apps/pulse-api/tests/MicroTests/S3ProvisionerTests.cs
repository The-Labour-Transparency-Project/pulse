using Amazon.S3;
using Amazon.S3.Model;
using Amazon.Runtime;
using Domain.Configuration;
using FluentAssertions;
using Infrastructure;

namespace MicroTests;

public sealed class S3ProvisionerTests
{
    [Fact]
    public async Task EnsureExists_checks_the_configured_bucket_without_listing_or_creating_buckets()
    {
        var client = new RecordingS3Client
        {
            ListObjects = [new ListObjectsV2Response()],
        };
        var provisioner = new S3Provisioner(client, Settings());

        await provisioner.EnsureExists(TestContext.Current.CancellationToken);

        client.ListObjectsCalls.Should().Be(1);
        client.ListBucketCalls.Should().Be(0);
        client.PutBucketCalls.Should().Be(0);
    }

    [Fact]
    public async Task EnsureExists_does_not_retry_non_transient_failures()
    {
        var client = new RecordingS3Client
        {
            ListObjects = [new AmazonS3Exception("Access denied") { ErrorCode = "AccessDenied" }],
        };
        var provisioner = new S3Provisioner(client, Settings());

        var action = () => provisioner.EnsureExists(TestContext.Current.CancellationToken);

        var exception = await action.Should().ThrowAsync<S3OperationException>();
        exception.Which.Kind.Should().Be(S3FailureKind.AccessDenied);
        client.ListObjectsCalls.Should().Be(1);
    }

    private static PulseSettings Settings() => new()
    {
        S3BucketName = "pulse-responses",
        RespondentBaseUrl = "http://localhost",
        SesSender = "sender@example.test",
        RespondentIdentityKey = new byte[32],
        TokenSigningKey = new byte[32],
        MaximumResponseBytes = 1024,
        AllowedWaveIds = ["pulse-2026"],
    };

    private sealed class RecordingS3Client : AmazonS3Client
    {
        public List<object> ListObjects { get; init; } = [];
        public int ListObjectsCalls { get; private set; }
        public int ListBucketCalls { get; private set; }
        public int PutBucketCalls { get; private set; }

        public override Task<ListObjectsV2Response> ListObjectsV2Async(
            ListObjectsV2Request request,
            CancellationToken cancellationToken = default)
        {
            ListObjectsCalls++;
            var result = ListObjects[0];
            ListObjects.RemoveAt(0);
            return result is Exception exception ? Task.FromException<ListObjectsV2Response>(exception) :
                Task.FromResult((ListObjectsV2Response)result);
        }
    }
}
