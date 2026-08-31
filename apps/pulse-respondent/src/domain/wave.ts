import definitionJson from "../../../../surveys/labour-transparency-pulse/v1/definition.json";
import {validateSurveyDefinition, type SurveyDefinition} from "./survey";

export interface WaveDefinition {
    waveId: string;
    surveyId: string;
    surveyVersion: string;
    validSurveyVersions: string;
    opensAt: string;
    closesAt: string;
}

export const defaultWave: WaveDefinition = {
    waveId: "pulse-2026",
    surveyId: "ltp.supply-chain-confidence",
    surveyVersion: "1.0.2",
    validSurveyVersions: "*",
    opensAt: "2026-08-28T00:00:00Z",
    closesAt: "2026-11-28T00:00:00Z",
};

const waves: readonly WaveDefinition[] = [defaultWave];
const surveyDefinitions: readonly SurveyDefinition[] = [validateSurveyDefinition(definitionJson)];

export function getWave(waveId: string): WaveDefinition | null {
    return waves.find((wave) => wave.waveId === waveId) ?? null;
}

/** Select the instrument configured by the wave. Version-rule evaluation is deferred. */
export function surveyForWave(wave: WaveDefinition): SurveyDefinition {
    const survey = surveyDefinitions.find((candidate) =>
        candidate.id === wave.surveyId && candidate.version === wave.surveyVersion);
    if (!survey) {
        throw new Error(`The survey instrument for wave '${wave.waveId}' is unavailable.`);
    }
    return survey;
}
