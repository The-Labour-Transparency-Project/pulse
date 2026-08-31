using System.Reflection;
using Domain;
using IntegrationTests.Attributes;

namespace IntegrationTests.Infrastructure;

public sealed class InfrastructureTests
{
    [Fact]
    public void RequiresS3_defaults_to_provisioning()
    {
        var attribute = typeof(S3Tests).GetCustomAttribute<RequiresS3Attribute>();

        Assert.NotNull(attribute);
        Assert.True(attribute!.EnsureExists);
    }

    [Fact]
    public void RequiresS3_false_skips_provisioning()
    {
        var attribute = typeof(S3WithoutProvisioningTests).GetCustomAttribute<RequiresS3Attribute>();

        Assert.NotNull(attribute);
        Assert.False(attribute!.EnsureExists);
    }


    [RequiresS3]
    private sealed class S3Tests
    {
    }

    [RequiresS3(false)]
    private sealed class S3WithoutProvisioningTests
    {
    }

    [RequiresS3]
    [RequiresDatabase]
    private sealed class OptedInTests
    {
        public void Run()
        {
        }
    }

    private sealed class OptedOutTests
    {
        public void Run()
        {
        }
    }

    private sealed class RecordingProvisioner : IS3Provisioner
    {
        public int Calls { get; private set; }

        public Task EnsureExists(CancellationToken cancellationToken = default)
        {
            Calls++;
            return Task.CompletedTask;
        }

        public Task CheckAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
