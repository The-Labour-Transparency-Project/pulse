import type { SurveyResponse } from "../domain/response";

export class ApiError extends Error {
    constructor(readonly status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

function apiBaseUrl(): string {
    const configured = import.meta.env.VITE_PULSE_API_BASE_URL;
    if (!configured) {
        throw new ApiError(0, "The respondent API is not configured.");
    }
    return configured.replace(/\/$/, "");
}

function endpoint(path: string): string {
    return `${apiBaseUrl()}${path}`;
}

async function responseError(response: Response): Promise<ApiError> {
    let message = `The respondent API returned ${response.status}.`;
    try {
        const body = await response.json() as { error?: unknown };
        if (typeof body.error === "string") {
            message = body.error;
        }
    } catch (error) {
        console.error("Failed response.", error);
        // Keep the status-based message when the API has no JSON error body.
    }
    return new ApiError(response.status, message);
}

export interface TokenRequestResult {
    accepted: boolean;
    message?: string;
}

export async function requestToken(waveId: string, surveyId: string, surveyVersion: string, email: string): Promise<TokenRequestResult> {
    let response: Response;
    try {
        response = await fetch(endpoint("/token"), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ waveId, surveyId, surveyVersion, email }),
        });
    } catch (error) {
        console.error("Failed to request a respondent access token.", error);
        throw new ApiError(0, "We could not reach the respondent service. Check your connection and try again.");
    }
    if (!response.ok) {
        throw await responseError(response);
    }
    return await response.json() as TokenRequestResult;
}

export async function refreshToken(token: string, email: string): Promise<{token: string; iat: number; exp: number}> {
    let response: Response;
    try {
        response = await fetch(endpoint("/token"), {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify({token, email}),
        });
    } catch (error) {
        console.error("Failed to refresh a respondent access token.", error);
        throw new ApiError(0, "We could not reach the respondent service. Check your connection and try again.");
    }
    if (!response.ok) throw await responseError(response);
    return await response.json() as {token: string; iat: number; exp: number};
}

export async function saveResponse(token: string, responseDocument: SurveyResponse): Promise<{
    responseVersion: string;
    receivedAt: string
}> {
    let response: Response;
    try {
        response = await fetch(endpoint("/response"), {
            method: "PUT",
            headers: { "authorization": `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify(responseDocument),
        });
    } catch (error) {
        console.error("Failed to save the respondent response.", error);
        throw new ApiError(0, "We could not reach the respondent service. Check your connection and try again.");
    }
    if (!response.ok) {
        throw await responseError(response);
    }
    return await response.json() as { responseVersion: string; receivedAt: string };
}
