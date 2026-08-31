export interface VerificationRecord {
    email: string;
    code: string;
}

export interface VerificationStrategy {
    readonly id: string;
    tokenErrorMessage: string;

    isValidToken(token: string): boolean;
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

export function verificationStorageKey(waveId: string, surveyId: string, surveyVersion: string, strategyId = "signed-token"): string {
    return `pulse-respondent-verification:${waveId}:${surveyId}:${surveyVersion}:${strategyId}`;
}

export function consumeVerificationTokenUrl(currentUrl: string): { token: string; cleanUrl: string } | null {
    const url = new URL(currentUrl);
    if (!url.searchParams.has("t")) return null;

    const token = url.searchParams.get("t")?.trim() ?? "";
    url.searchParams.delete("t");
    return {
        token,
        cleanUrl: `${url.pathname}${url.search}${url.hash}`,
    };
}

export function isValidVerificationEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function parseVerificationRecord(value: unknown, strategy: VerificationStrategy = new SignedTokenVerificationStrategy()): VerificationRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Partial<VerificationRecord>;
    if (typeof candidate.code !== "string" || !strategy.isValidToken(candidate.code)) return null;
    // Access links contain the signed credential but not the email address. The
    // email remains optional after link entry and is only needed to request a
    // new credential.
    const email = typeof candidate.email === "string" ? candidate.email.trim() : "";
    if (email && !isValidVerificationEmail(email)) return null;
    return {email, code: candidate.code.trim()};
}
