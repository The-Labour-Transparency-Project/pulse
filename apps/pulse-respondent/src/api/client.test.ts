import {beforeEach, describe, expect, it, vi} from "vitest";
import {refreshToken, requestToken, saveResponse} from "./client";

describe("respondent API client", () => {
    beforeEach(() => {
        vi.stubEnv("VITE_PULSE_API_BASE_URL", "https://api.example.test/");
        vi.stubGlobal("fetch", vi.fn());
    });

    it("requests a token from the configured API origin", async () => {
        vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}));

        await requestToken("pulse-2026", "ltp.supply-chain-confidence", "1.0.2", "respondent@example.com");

        expect(fetch).toHaveBeenCalledWith("https://api.example.test/token", expect.objectContaining({
            method: "POST",
            body: JSON.stringify({waveId: "pulse-2026", surveyId: "ltp.supply-chain-confidence", surveyVersion: "1.0.2", email: "respondent@example.com"}),
        }));
    });

    it("saves a response with the signed bearer credential", async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({responseVersion: "01", receivedAt: "now"}));
        const document = {surveyId: "pulse-2026"} as never;

        await saveResponse("signed-token", document);

        expect(fetch).toHaveBeenCalledWith("https://api.example.test/response", expect.objectContaining({
            method: "PUT",
            headers: expect.objectContaining({authorization: "Bearer signed-token"}),
            body: JSON.stringify(document),
        }));
    });

    it("refreshes a token with the token and email", async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({token: "new-token", iat: 10, exp: 20}));

        await expect(refreshToken("old-token", "respondent@example.com")).resolves.toEqual({token: "new-token", iat: 10, exp: 20});
        expect(fetch).toHaveBeenCalledWith("https://api.example.test/token", expect.objectContaining({
            method: "POST",
            body: JSON.stringify({token: "old-token", email: "respondent@example.com"}),
        }));
    });
});
