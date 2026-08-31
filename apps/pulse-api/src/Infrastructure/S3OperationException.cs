using Amazon.Runtime;
using Amazon.S3;

namespace Infrastructure;

public enum S3FailureKind
{
    MissingBucket,
    AccessDenied,
    Connectivity,
    ServiceUnavailable,
    Configuration,
    Unknown,
}

public sealed class S3OperationException : Exception
{
    private S3OperationException(
        string operation,
        string bucket,
        S3FailureKind kind,
        string? awsErrorCode,
        int? statusCode,
        string? requestId,
        Exception innerException)
        : base($"S3 {operation} failed for bucket '{bucket}' ({kind}).", innerException)
    {
        Operation = operation;
        Bucket = bucket;
        Kind = kind;
        AwsErrorCode = awsErrorCode;
        StatusCode = statusCode;
        RequestId = requestId;
    }

    public string Operation { get; }
    public string Bucket { get; }
    public S3FailureKind Kind { get; }
    public string? AwsErrorCode { get; }
    public int? StatusCode { get; }
    public string? RequestId { get; }

    public static S3OperationException From(string operation, string bucket, Exception exception)
    {
        var s3Exception = exception as AmazonS3Exception;
        var serviceException = exception as AmazonServiceException;
        var errorCode = s3Exception?.ErrorCode ?? serviceException?.ErrorCode;
        var statusCode = s3Exception?.StatusCode ?? serviceException?.StatusCode;
        var kind = errorCode switch
        {
            "NoSuchBucket" or "NotFound" => S3FailureKind.MissingBucket,
            "AccessDenied" or "AllAccessDisabled" or "InvalidAccessKeyId" or "SignatureDoesNotMatch"
                => S3FailureKind.AccessDenied,
            "InvalidEndpoint" or "PermanentRedirect" => S3FailureKind.Configuration,
            _ when exception is AmazonClientException && serviceException is null => S3FailureKind.Connectivity,
            _ when statusCode is not null && (int)statusCode >= 500 => S3FailureKind.ServiceUnavailable,
            _ => S3FailureKind.Unknown,
        };

        return new S3OperationException(
            operation,
            bucket,
            kind,
            errorCode,
            statusCode is null ? null : (int)statusCode,
            s3Exception?.RequestId ?? serviceException?.RequestId,
            exception);
    }
}
