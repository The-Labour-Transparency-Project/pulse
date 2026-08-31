namespace Domain;

public static class EmailAddress
{
    public static bool IsValid(string? value)
    {
        return !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 320 && value.Count(c => c == '@') == 1 &&
               !value.Contains(' ') && value.IndexOf('@') > 0 && value.IndexOf('@') < value.Length - 1;
    }
}