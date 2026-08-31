import {describe, expect, it} from "vitest";
import definitionJson from "../../../../surveys/labour-transparency-pulse/v1/definition.json";
import {serializeSurveyResponse} from "./response";
import {validateSurveyDefinition} from "./survey";

describe("matrix multi-select responses", () => {
    it("serializes one answer per row", () => {
        const survey = validateSurveyDefinition({
            ...definitionJson,
            items: [
                {
                    ...definitionJson.items.find(
                        (item) => item.id === "awareness-risk.familiarity",
                    ),
                    kind: "multiSelect",
                    layout: "matrix",
                },
            ],
        });

        const response = serializeSurveyResponse(
            survey,
            {
                "awareness-risk.familiarity": {
                    "awareness-risk.worker-exploitation": ["familiarity.0"],
                    "awareness-risk.forced-labour": ["familiarity.1", "familiarity.2"],
                },
            },
            {},
            {
                createId: (() => {
                    let id = 0;
                    return () => `answer-${++id}`;
                })()
            },
        );

        expect(response.waveId).toBe("pulse-2026");

        expect(response.answers).toEqual(expect.arrayContaining([
            expect.objectContaining({
                itemId: "awareness-risk.familiarity",
                rowId: "awareness-risk.worker-exploitation",
                selectedOptionIds: ["familiarity.0"],
            }),
            expect.objectContaining({
                itemId: "awareness-risk.familiarity",
                rowId: "awareness-risk.forced-labour",
                selectedOptionIds: ["familiarity.1", "familiarity.2"],
            }),
        ]));
        expect(response.answers).toHaveLength(4);
    });
});
