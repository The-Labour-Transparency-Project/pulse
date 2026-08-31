import {describe, expect, it} from "vitest";
import definitionJson from "../../../../surveys/labour-transparency-pulse/v1/definition.json";
import {
    answerProgress,
    type Answers,
    answerStatus,
    evaluateExpression,
    isItemAnswered,
    isSelectedOptionsDependent,
    localized,
    matchesQuestionNavigatorFilter,
    multiSelectValidationError,
    reconcileDependentAnswers,
    resolveItemOptions,
    surveyItemNumber,
    updateMultiSelectAnswer,
    validateSurveyDefinition,
} from "./survey";

const survey = validateSurveyDefinition(definitionJson);
const item = (id: string) =>
    survey.items.find((candidate) => candidate.id === id)!;
const sourceOptions = (id: string) =>
    survey.optionSets.find((set) => set.id === item(id).optionSetRef)!.options;

describe("derived primary choices", () => {
    it("keeps conditional items in the sequential reporting numbering", () => {
        expect(surveyItemNumber(survey, item("context.primary-activity"))).toBe(2);
        expect(surveyItemNumber(survey, item("context.primary-sector"))).toBe(6);
    });

    it("identifies dependent questions so unavailable ones can remain visible", () => {
        expect(isSelectedOptionsDependent(item("context.primary-sector"))).toBe(
            true,
        );
        expect(isSelectedOptionsDependent(item("context.sector"))).toBe(false);
    });

    it("hides a primary question for one selected source option and never auto-selects", () => {
        const answers: Answers = {"context.activity": ["activity.0"]};
        expect(
            evaluateExpression(
                item("context.primary-activity").visibleWhen,
                answers,
                survey,
            ),
        ).toBe(false);
        expect(
            resolveItemOptions(survey, item("context.primary-activity"), answers).map(
                (option) => option.id,
            ),
        ).toEqual(["activity.0", "special.no-primary"]);
        expect(answers["context.primary-activity"]).toBeUndefined();
    });

    it("shows only eligible selected activities and appends no-primary for multiple selections", () => {
        const answers: Answers = {"context.activity": ["activity.0", "activity.15", "activity.16"]};
        expect(
            evaluateExpression(
                item("context.primary-activity").visibleWhen,
                answers,
                survey,
            ),
        ).toBe(true);
        expect(
            resolveItemOptions(survey, item("context.primary-activity"), answers).map(
                (option) => option.id,
            ),
        ).toEqual(["activity.0", "special.no-primary"]);
    });

    it("clears a primary answer when its source option is removed", () => {
        const answers: Answers = {
            "context.activity": ["activity.0", "activity.1"],
            "context.primary-activity": "activity.1",
        };
        reconcileDependentAnswers(survey, answers);
        expect(answers["context.primary-activity"]).toBe("activity.1");
        answers["context.activity"] = ["activity.0"];
        reconcileDependentAnswers(survey, answers);
        expect(answers["context.primary-activity"]).toBeUndefined();
    });

    it("uses tagged counts for regions, excluding non-NZ scope options", () => {
        const outside = sourceOptions("context.region").find(
            (option) => Object.values(option.label)[0] === "Outside New Zealand",
        )!.id;
        const nz = sourceOptions("context.region")
            .filter((option) => option.tags?.includes("newZealandRegion"))
            .slice(0, 2)
            .map((option) => option.id);
        const primary = item("context.primary-region");
        expect(
            evaluateExpression(
                primary.visibleWhen,
                {"context.region": [nz[0], outside]},
                survey,
            ),
        ).toBe(false);
        expect(
            evaluateExpression(
                primary.visibleWhen,
                {"context.region": [...nz, outside]},
                survey,
            ),
        ).toBe(true);
        expect(
            resolveItemOptions(survey, primary, {
                "context.region": [...nz, outside],
            }).map((option) => option.id),
        ).toEqual([...nz, "special.no-primary-region"]);
    });
});

describe("multi-select semantics and validation", () => {
    it("preserves regular selections and clears them for an exclusive option", () => {
        const options = sourceOptions("context.sector");
        expect(
            updateMultiSelectAnswer(["sector.0"], "sector.1", true, options),
        ).toEqual(["sector.0", "sector.1"]);
        expect(
            updateMultiSelectAnswer(
                ["sector.0", "sector.10"],
                "sector.10",
                true,
                options,
            ),
        ).toEqual(["sector.10"]);
        expect(
            updateMultiSelectAnswer(["sector.0", "sector.1"], "sector.14", true, options),
        ).toEqual(["sector.14"]);
        expect(
            updateMultiSelectAnswer(["sector.0"], "sector.0", false, options),
        ).toEqual([]);
    });

    it("exposes min and max validation state", () => {
        const constrained = {
            ...item("awareness-risk.hidden-risk"),
            validation: {minSelections: 2, maxSelections: 3},
        };
        expect(multiSelectValidationError(constrained, ["a"])).toContain(
            "at least",
        );
        expect(
            multiSelectValidationError(constrained, ["a", "b", "c", "d"]),
        ).toContain("no more than");
        expect(multiSelectValidationError(constrained, ["a", "b"])).toBeUndefined();
    });
});

describe("matrix answer progress", () => {
    it("tracks completed rows without marking a partial matrix answered", () => {
        const matrix = item("awareness-risk.risk");
        const value = {
            [matrix.rows![0].id]: "risk.0",
            [matrix.rows![1].id]: "risk.1",
        };

        expect(answerProgress(matrix, value)).toEqual({
            completed: 2,
            total: 8,
            complete: false,
        });
        expect(isItemAnswered(matrix, value)).toBe(false);
    });

    it("marks a matrix answered only after every row is complete", () => {
        const matrix = item("awareness-risk.risk");
        const value = Object.fromEntries(
            matrix.rows!.map((row, index) => [row.id, `risk.${index}`]),
        );

        expect(answerProgress(matrix, value)).toEqual({
            completed: 8,
            total: 8,
            complete: true,
        });
        expect(isItemAnswered(matrix, value)).toBe(true);
    });

    it("tracks rows for multi-select matrices as well", () => {
        const matrix = {
            ...item("awareness-risk.risk"),
            kind: "multiSelect" as const,
            layout: "matrix" as const,
        };
        const value = {
            [matrix.rows![0].id]: ["risk.0"],
            [matrix.rows![1].id]: ["risk.1", "risk.2"],
        };

        expect(answerProgress(matrix, value).completed).toBe(2);
        expect(isItemAnswered(matrix, value)).toBe(false);
    });
});

describe("answer status", () => {
    it("distinguishes not visited from visited unanswered items", () => {
        const question = item("context.seasonal-worker-count");

        expect(answerStatus(question, undefined, false)).toBe("notVisited");
        expect(answerStatus(question, undefined, true)).toBe("unanswered");
    });

    it("keeps partial matrix progress distinct from unanswered", () => {
        const matrix = item("awareness-risk.risk");
        const value = {[matrix.rows![0].id]: "risk.0"};

        expect(answerStatus(matrix, value, false)).toBe("partial");
    });

    it("returns answered only when every matrix row is complete", () => {
        const matrix = item("awareness-risk.risk");
        const value = Object.fromEntries(
            matrix.rows!.map((row, index) => [row.id, `risk.${index}`]),
        );

        expect(answerStatus(matrix, value, true)).toBe("answered");
    });
});

describe("question navigator filtering", () => {
    it("does not show a fully answered item in the unanswered view", () => {
        const question = item("confidence.organisation-confidence");

        expect(
            matchesQuestionNavigatorFilter(question, "example", "Unanswered only"),
        ).toBe(false);
        expect(
            matchesQuestionNavigatorFilter(question, undefined, "Unanswered only"),
        ).toBe(true);
    });

    it("keeps partially completed matrix items in the unanswered view", () => {
        const matrix = item("awareness-risk.risk");
        const value = {[matrix.rows![0].id]: "risk.0"};

        expect(
            matchesQuestionNavigatorFilter(matrix, value, "Unanswered only"),
        ).toBe(true);
    });
});

describe("localized item guidance", () => {
    it("resolves an instruction in the active locale", () => {
        expect(
            localized({"en-NZ": "Select one.", mi: "Tīpakohia kotahi."}, "mi"),
        ).toBe("Tīpakohia kotahi.");
    });

    it("returns no text for a missing instruction", () => {
        expect(localized(undefined, "en-NZ")).toBe("");
    });

    it("falls back to the first available locale", () => {
        expect(localized({"en-NZ": "Select up to three."}, "mi")).toBe(
            "Select up to three.",
        );
    });

    it("keeps instructions and descriptions independent", () => {
        const itemWithGuidance = {
            ...item("context.seasonal-worker-count"),
            instruction: {"en-NZ": "Select one."},
        };
        expect(localized(itemWithGuidance.instruction, "en-NZ")).toBe(
            "Select one.",
        );
        expect(localized(itemWithGuidance.description, "en-NZ")).toContain(
            "Include seasonal workers",
        );
    });

    it("keeps selection validation separate from instruction text", () => {
        const constrained = item("awareness-risk.hidden-risk");
        expect(localized(constrained.instruction, "en-NZ")).toBe(
            "Select up to three.",
        );
        expect(multiSelectValidationError(constrained, ["a", "b", "c", "d"])).to
            .contain("no more than");
    });
});
