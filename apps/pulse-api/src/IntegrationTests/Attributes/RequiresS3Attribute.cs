namespace IntegrationTests.Attributes;

[AttributeUsage(AttributeTargets.Class)]
public sealed class RequiresS3Attribute(bool ensureExists = true) : Attribute
{
    public bool EnsureExists { get; } = ensureExists;
}