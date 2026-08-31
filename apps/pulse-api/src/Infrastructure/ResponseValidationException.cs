namespace Infrastructure;

public sealed class ResponseValidationException(string message) : Exception(message);