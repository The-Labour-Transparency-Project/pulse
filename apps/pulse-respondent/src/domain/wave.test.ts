import {describe, expect, it} from "vitest";
import {defaultWave, getWave, surveyForWave} from "./wave";

describe("survey waves", () => {
    it("defines the default wave profile", () => {
        expect(defaultWave).toMatchObject({
            waveId: "pulse-2026",
            surveyId: "ltp.supply-chain-confidence",
            surveyVersion: "1.0.2",
            validSurveyVersions: "*",
        });
    });

    it("selects the instrument version configured by the wave", () => {
        expect(surveyForWave(defaultWave)).toMatchObject({
            id: defaultWave.surveyId,
            version: defaultWave.surveyVersion,
        });
        expect(getWave("missing-wave")).toBeNull();
    });
});
