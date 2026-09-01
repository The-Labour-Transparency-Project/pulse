using System.Text.Json;

namespace Infrastructure;

public interface ISurveyCatalog
{
    string? GetTitle(string surveyId, string surveyVersion);
}

public sealed class EmbeddedSurveyCatalog : ISurveyCatalog
{
    private const string ResourcePrefix = "Infrastructure.SurveyDefinitions.";
    private readonly IReadOnlyDictionary<(string Id, string Version), string> titles = LoadTitles();

    public string? GetTitle(string surveyId, string surveyVersion)
    {
        return titles.GetValueOrDefault((surveyId, surveyVersion));
    }

    private static IReadOnlyDictionary<(string Id, string Version), string> LoadTitles()
    {
        var titles = new Dictionary<(string Id, string Version), string>();
        var assembly = typeof(EmbeddedSurveyCatalog).Assembly;

        foreach (var resourceName in assembly.GetManifestResourceNames()
                     .Where(name =>
                         name.StartsWith(ResourcePrefix, StringComparison.Ordinal) &&
                         name.EndsWith(".json", StringComparison.Ordinal)))
        {
            using var stream = assembly.GetManifestResourceStream(resourceName)
                               ?? throw new InvalidOperationException(
                                   $"Embedded survey definition resource '{resourceName}' could not be opened.");
            using var document = JsonDocument.Parse(stream);
            var root = document.RootElement;
            var id = root.GetProperty("id").GetString();
            var version = root.GetProperty("version").GetString();
            var defaultLocale = root.GetProperty("defaultLocale").GetString();
            var localizedTitles = root.GetProperty("title");

            if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(version) ||
                string.IsNullOrWhiteSpace(defaultLocale) || localizedTitles.ValueKind != JsonValueKind.Object)
            {
                throw new InvalidOperationException(
                    $"Embedded survey definition resource '{resourceName}' has incomplete title metadata.");
            }

            var title = localizedTitles.TryGetProperty(defaultLocale, out var defaultTitle)
                ? defaultTitle.GetString()
                : localizedTitles.EnumerateObject().Select(property => property.Value.GetString()).FirstOrDefault();

            if (string.IsNullOrWhiteSpace(title))
            {
                throw new InvalidOperationException(
                    $"Embedded survey definition resource '{resourceName}' has no usable title.");
            }

            titles[(id, version)] = title;
        }

        return titles;
    }
}