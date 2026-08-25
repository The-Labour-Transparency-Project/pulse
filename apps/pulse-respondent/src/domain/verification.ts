export interface VerificationRecord {
  email: string;
  code: string;
}

export interface VerificationStrategy {
  readonly id: string;
  isValidToken(token: string): boolean;
  tokenErrorMessage: string;
}

/** Verification strategy for opaque tokens signed and validated by the API. */
export class SignedTokenVerificationStrategy implements VerificationStrategy {
  readonly id = "signed-token";
  readonly tokenErrorMessage = "Enter the signed verification token.";

  isValidToken(token: string): boolean {
    const value = token.trim();
    // Signature validation belongs to the API. The client only checks that a
    // token was supplied and does not constrain its signed-token format.
    return value.length > 0 && !/\s/.test(value);
  }
}

export function verificationStorageKey(surveyId: string, surveyVersion: string, strategyId = "signed-token"): string {
  return `pulse-respondent-verification:${surveyId}:${surveyVersion}:${strategyId}`;
}

export function isValidVerificationEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function parseVerificationRecord(value: unknown, strategy: VerificationStrategy = new SignedTokenVerificationStrategy()): VerificationRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<VerificationRecord>;
  if (typeof candidate.email !== "string" || typeof candidate.code !== "string") return null;
  if (!isValidVerificationEmail(candidate.email) || !strategy.isValidToken(candidate.code)) return null;
  return { email: candidate.email.trim(), code: candidate.code.trim() };
}
