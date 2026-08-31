using System.Net;
using Amazon.Runtime;
using Amazon.S3;
using FluentAssertions;
using Infrastructure;

namespace MicroTests;

public sealed class S3OperationExceptionTests
{
    [Fact]
    public void Missing_bucket_is_classified_without_exposing_the_response_body()
    {
        var cause = new AmazonS3Exception("The specified bucket does not exist")
        {
            ErrorCode = "NoSuchBucket",
            StatusCode = HttpStatusCode.NotFound,
            RequestId = "request-123",
        };

        var result = S3OperationException.From("PutObject", "pulse-responses", cause);

        result.Kind.Should().Be(S3FailureKind.MissingBucket);
        result.AwsErrorCode.Should().Be("NoSuchBucket");
        result.StatusCode.Should().Be(404);
        result.RequestId.Should().Be("request-123");
        result.Message.Should().NotContain(cause.Message);
    }

    [Fact]
    public void Client_exception_is_classified_as_connectivity_failure()
    {
        var result = S3OperationException.From(
            "ListObjectsV2",
            "pulse-responses",
            new AmazonClientException("Connection refused"));

        result.Kind.Should().Be(S3FailureKind.Connectivity);
    }
}
