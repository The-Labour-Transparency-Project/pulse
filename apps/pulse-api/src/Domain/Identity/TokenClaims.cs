namespace Domain.Identity;

public sealed record TokenClaims(string WaveId, string RespondentId, long IssuedAt, long ExpiresAt);
