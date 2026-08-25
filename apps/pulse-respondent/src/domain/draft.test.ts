import { describe, expect, it } from "vitest";
import definitionJson from "../../../../surveys/labour-transparency-pulse/v1/definition.json";
import {
    draftStorageKey,
    destinationStorageKey,
    createJsonStorageSerializer,
    isViewMode,
    parseSurveyDraft,
    parseSurveyDestination,
    parseSurveyPosition,
    positionStorageKey,
} from "./draft";
import { validateSurveyDefinition } from "./survey";

const survey = validateSurveyDefinition(definitionJson);

describe("survey drafts", () => {
    it("serializes object storage values as JSON and safely ignores invalid legacy values", () => {
        const value = { answers: { "awareness-risk.familiarity": ["familiarity.0"] } };
        const serializer = createJsonStorageSerializer<typeof value>();

        expect(serializer.read(serializer.write(value))).toEqual(value);
        expect(serializer.read("[object Object]")).toBeNull();
    });
    it("uses a survey and version scoped position key", () => {
        expect(positionStorageKey(survey)).toBe(`pulse-respondent-position:${survey.id}:${survey.version}`);
    });

    it("stores and validates non-question destinations by survey version", () => {
        expect(destinationStorageKey(survey)).toBe(`pulse-respondent-destination:${survey.id}:${survey.version}`);
        expect(parseSurveyDestination({ type: "review" }, survey)).toEqual({ type: "review" });
        expect(parseSurveyDestination({ type: "question", sectionId: survey.sections[0].id }, survey)).toEqual({
            type: "question", sectionId: survey.sections[0].id,
        });
        expect(parseSurveyDestination({ type: "question", sectionId: "missing" }, survey)).toBeNull();
    });

    it("accepts positions within the instrument and rejects invalid positions", () => {
        expect(parseSurveyPosition({ sectionIndex: 0, questionIndex: 0 }, survey)).toEqual({
            sectionIndex: 0,
            questionIndex: 0,
        });
        expect(parseSurveyPosition({ sectionIndex: -1, questionIndex: 0 }, survey)).toBeNull();
        expect(parseSurveyPosition({ sectionIndex: 0, questionIndex: 999 }, survey)).toBeNull();
    });

    it("recognizes supported view modes only", () => {
        expect(isViewMode("continuous")).toBe(true);
        expect(isViewMode("sections")).toBe(true);
        expect(isViewMode("question")).toBe(true);
        expect(isViewMode("compact")).toBe(false);
    });

    it("uses a survey and version scoped storage key", () => {
        expect(draftStorageKey(survey)).toBe(`pulse-respondent-draft:${survey.id}:${survey.version}`);
    });

    it("hydrates valid answers and drops unknown or malformed values", () => {
        const draft = parseSurveyDraft({
            surveyId: survey.id,
            surveyVersion: survey.version,
            answers: {
                "awareness-risk.familiarity": ["familiarity.0"],
                unknown: "should be ignored",
                "awareness-risk.severity": { bad: 42 },
            },
            detailAnswers: { "awareness-risk.familiarity::familiarity.0": "detail" },
            sectionIndex: 1,
            questionIndex: 2,
            viewMode: "question",
            visitedQuestionIds: ["awareness-risk.familiarity"],
        }, survey);

        expect(draft?.answers).toEqual({ "awareness-risk.familiarity": ["familiarity.0"] });
        expect(draft?.detailAnswers).toEqual({ "awareness-risk.familiarity::familiarity.0": "detail" });
    });

    it("hydrates row values for matrix answers", () => {
        const draft = parseSurveyDraft({
            surveyId: survey.id,
            surveyVersion: survey.version,
            answers: {
                "awareness-risk.familiarity": {
                    "awareness-risk.worker-exploitation": "familiarity.2",
                    "awareness-risk.forced-labour": "familiarity.1",
                },
            },
            detailAnswers: {},
            sectionIndex: 1,
            questionIndex: 0,
            viewMode: "question",
            visitedQuestionIds: ["awareness-risk.familiarity"],
        }, survey);

        expect(draft?.answers["awareness-risk.familiarity"]).toEqual({
            "awareness-risk.worker-exploitation": "familiarity.2",
            "awareness-risk.forced-labour": "familiarity.1",
        });
    });

    it("rejects drafts from another instrument version", () => {
        expect(parseSurveyDraft({ surveyId: survey.id, surveyVersion: "old", answers: {} }, survey)).toBeNull();
    });

    it("rejects drafts with an invalid saved position", () => {
        expect(parseSurveyDraft({
            surveyId: survey.id,
            surveyVersion: survey.version,
            answers: {},
            detailAnswers: {},
            sectionIndex: 999,
            questionIndex: 0,
            viewMode: "question",
            visitedQuestionIds: [],
        }, survey)).toBeNull();
    });
});
