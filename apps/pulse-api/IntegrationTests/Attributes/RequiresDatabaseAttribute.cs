namespace IntegrationTests.Attributes;

[AttributeUsage(AttributeTargets.Class)]
public sealed class RequiresDatabaseAttribute(bool migrateToLatest = true) : Attribute
{
    public bool MigrateToLatest { get; } = migrateToLatest;
}