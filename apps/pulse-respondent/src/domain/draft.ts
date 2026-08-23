import type { Answers, DetailAnswers, AnswerValue, SurveyDefinition } from "./survey";

/** JSON storage for object drafts. Invalid legacy values are discarded safely. */
export interface JsonStorageSerializer<T> {
    read(value: string): T | null;
    write(value: T | null): string;
}

export function createJsonStorageSerializer<T>(): JsonStorageSerializer<T> {
    return {
        read(value: string): T | null {
            try {
                return JSON.parse(value) as T;
            } catch {
                return null;
            }
        },
        write(value: T | null): string {
            return JSON.stringify(value);
        },
    };
}

export interface SurveyDraft {
    surveyId: string;
    surveyVersion: string;
    answers: Answers;
    detailAnswers: DetailAnswers;
    sectionIndex: number;
    questionIndex: number;
    viewMode: "continuous" | "sections" | "question";
    visitedQuestionIds: string[];
}

export const draftStorageSerializer = createJsonStorageSerializer<SurveyDraft>();

export interface SurveyPosition {
    sectionIndex: number;
    questionIndex: number;
}

export type ViewMode = SurveyDraft["viewMode"];

export function isViewMode(value: unknown): value is ViewMode {
    return value === "continuous" || value === "sections" || value === "question";
}

function isAnswerValue(value: unknown): value is AnswerValue {
    if (value === undefined || typeof value === "string" || typeof value === "number") return true;
    if (Array.isArray(value)) return value.every((entry) => typeof entry === "string");
    if (!value || typeof value !== "object") return false;
    return Object.values(value).every((entry) =>
        typeof entry === "string" || (Array.isArray(entry) && entry.every((id) => typeof id === "string")),
    );
}

function readAnswers(value: unknown, survey: SurveyDefinition): Answers {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const answerableIds = new Set(survey.items.filter((item) => item.kind !== "content").map((item) => item.id));
    return Object.fromEntries(Object.entries(value).filter(([id, answer]) => answerableIds.has(id) && isAnswerValue(answer)));
}

function readDetailAnswers(value: unknown): DetailAnswers {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, answer]) => typeof answer === "string"));
}

export function draftStorageKey(survey: SurveyDefinition): string {
    return `pulse-respondent-draft:${survey.id}:${survey.version}`;
}

export function positionStorageKey(survey: SurveyDefinition): string {
    return `pulse-respondent-position:${survey.id}:${survey.version}`;
}

export function parseSurveyPosition(value: unknown, survey: SurveyDefinition): SurveyPosition | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Partial<SurveyPosition>;
    if (!Number.isInteger(candidate.sectionIndex) || !Number.isInteger(candidate.questionIndex)) return null;
    const sectionIndex = candidate.sectionIndex as number;
    const questionIndex = candidate.questionIndex as number;
    if (sectionIndex < 0 || sectionIndex >= survey.sections.length) return null;
    const section = survey.sections[sectionIndex];
    if (questionIndex < 0 || questionIndex >= section.itemIds.length) return null;
    return {
        sectionIndex,
        questionIndex,
    };
}

export function parseSurveyDraft(value: unknown, survey: SurveyDefinition): SurveyDraft | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Partial<SurveyDraft>;
    if (candidate.surveyId !== survey.id || candidate.surveyVersion !== survey.version) return null;
    if (!Number.isInteger(candidate.sectionIndex) || !Number.isInteger(candidate.questionIndex)) return null;
    if (!Array.isArray(candidate.visitedQuestionIds) || !candidate.visitedQuestionIds.every((id) => typeof id === "string")) return null;
    if (!isViewMode(candidate.viewMode)) return null;
    const sectionIndex = candidate.sectionIndex as number;
    const questionIndex = candidate.questionIndex as number;
    if (sectionIndex < 0 || sectionIndex >= survey.sections.length) return null;
    if (questionIndex < 0 || questionIndex >= survey.sections[sectionIndex].itemIds.length) return null;
    return {
        surveyId: survey.id,
        surveyVersion: survey.version,
        answers: readAnswers(candidate.answers, survey),
        detailAnswers: readDetailAnswers(candidate.detailAnswers),
        sectionIndex,
        questionIndex,
        viewMode: candidate.viewMode,
        visitedQuestionIds: candidate.visitedQuestionIds,
    };
}
