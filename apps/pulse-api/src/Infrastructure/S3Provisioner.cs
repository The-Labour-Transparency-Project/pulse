using Amazon.S3;
using Amazon.S3.Model;
using Amazon.Runtime;
using Domain;
using Domain.Configuration;

namespace Infrastructure;

public sealed class S3Provisioner(IAmazonS3 client, PulseSettings settings) : IS3Provisioner
{
    public async Task CheckAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await client.ListObjectsV2Async(
                new ListObjectsV2Request
                {
                    BucketName = settings.S3BucketName,
                    Prefix = "responses/",
                    MaxKeys = 0,
                },
                cancellationToken);
        }
        catch (Exception exception) when (exception is AmazonClientException or AmazonServiceException)
        {
            throw S3OperationException.From("CheckBucket", settings.S3BucketName, exception);
        }
    }

    public async Task EnsureExists(CancellationToken cancellationToken = default)
    {
        // Bucket lifecycle is owned by Terraform. Runtime credentials should
        // only need access to this configured bucket, not account-wide bucket
        // discovery (s3:ListAllMyBuckets) or bucket creation.
        await CheckAsync(cancellationToken);
    }
}
