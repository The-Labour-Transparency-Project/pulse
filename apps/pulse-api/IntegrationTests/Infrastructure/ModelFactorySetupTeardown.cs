using System.Reflection;
using Domain;
using IntegrationTests.Attributes;
using Xunit.DependencyInjection;

namespace IntegrationTests.Infrastructure;

public sealed class ModelFactorySetupTeardown(IS3Provisioner s3Provisioner) : BeforeAfterTest
{
    public override async ValueTask BeforeAsync(object testClassInstance, MethodInfo methodUnderTest)
    {
        var testType = testClassInstance.GetType();
        var requiresS3 = testType.GetCustomAttribute<RequiresS3Attribute>();
        if (requiresS3?.EnsureExists == true)
        {
            await s3Provisioner.EnsureExists();
        }
    }

    public override async ValueTask AfterAsync(object testClassInstance, MethodInfo methodUnderTest)
    {
    }
}