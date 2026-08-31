import {describe, expect, it} from "vitest";
import {
    isValidVerificationEmail,
    parseVerificationRecord,
    SignedTokenVerificationStrategy,
    consumeVerificationTokenUrl,
    verificationStorageKey,
    type VerificationStrategy,
} from "./verification";

describe("verification", () => {
    const strategy = new SignedTokenVerificationStrategy();

    it("scopes saved verification to the survey version", () => {
        expect(strategy.id).toBe("signed-token");
        expect(verificationStorageKey("pulse-2026", "pulse", "v1", strategy.id)).toBe("pulse-respondent-verification:pulse-2026:pulse:v1:signed-token");
    });

    it("extracts t and removes it while preserving the path, other params, and hash", () => {
        expect(consumeVerificationTokenUrl("https://survey.example.test/?t=signed.token&mode=review#submit"))
            .toEqual({token: "signed.token", cleanUrl: "/?mode=review#submit"});
        expect(consumeVerificationTokenUrl("https://survey.example.test/"))
            .toBeNull();
    });

    it("validates email addresses and opaque signed tokens", () => {
        expect(isValidVerificationEmail("respondent@example.com")).toBe(true);
        expect(isValidVerificationEmail("not-an-email")).toBe(false);
        expect(strategy.isValidToken("eyJhbGciOiJIUzI1NiJ9.payload.signature")).toBe(true);
        expect(strategy.isValidToken("123456")).toBe(true);
        expect(strategy.isValidToken(" ")).toBe(false);
        expect(strategy.isValidToken("token with spaces")).toBe(false);
    });

    it("hydrates records with or without an email address", () => {
        expect(parseVerificationRecord({email: " respondent@example.com ", code: "signed.token"}, strategy)).toEqual({
            email: "respondent@example.com",
            code: "signed.token",
        });
        expect(parseVerificationRecord({email: "respondent@example.com", code: ""}, strategy)).toBeNull();
        expect(parseVerificationRecord({code: "signed.token"}, strategy)).toEqual({email: "", code: "signed.token"});
    });

    it("allows a different strategy to define token validity", () => {
        const strategy: VerificationStrategy = {
            id: "test-token",
            tokenErrorMessage: "Enter a test token.",
            isValidToken: (token) => token === "accepted",
        };
        expect(parseVerificationRecord({email: "respondent@example.com", code: "accepted"}, strategy)).not.toBeNull();
        expect(parseVerificationRecord({email: "respondent@example.com", code: "signed.token"}, strategy)).toBeNull();
    });
});
