export type LocalizedText = Record<string, string>;

export interface SurveyOption {
    id: string;
    label: LocalizedText;
    tags?: string[];
    semantics?: { kind: string; countsAsSubstantive?: boolean };
    selection?: { exclusive: boolean };
    detailInput?: { type: "text" | "longText"; answerRequired?: boolean };
}

export interface SurveyExpression {
    operator: string;
    arguments?: unknown[];
    itemId?: string;
    optionId?: string;
    tag?: string;
    value?: unknown;
}

export interface SurveyItem {
    id: string;
    kind:
        | "content"
        | "singleSelect"
        | "multiSelect"
        | "matrixSingleSelect"
        | "integerScale"
        | "longText"
        | string;
    layout?: "list" | "matrix";
    title: LocalizedText;
    instruction?: LocalizedText;
    description?: LocalizedText;
    answerRequired: boolean;
    optionSetRef?: string;
    rows?: Array<{ id: string; label: LocalizedText; optionSetRef?: string }>;
    scale?: {
        min: number;
        max: number;
        step: number;
        minLabel?: LocalizedText;
        maxLabel?: LocalizedText;
    };
    validation?: { minSelections?: number; maxSelections?: number };
    visibleWhen?: SurveyExpression;
    optionSource?: {
        type: "static" | "selectedOptions" | "external";
        itemId?: string;
        appendOptionIds?: string[];
        filter?: SurveyExpression;
    };
}

export interface SurveySection {
    id: string;
    title: LocalizedText;
    description?: LocalizedText;
    itemIds: string[];
}

export interface SurveyDefinition {
    id: string;
    version: string;
    title: LocalizedText;
    defaultLocale: string;
    sections: SurveySection[];
    items: SurveyItem[];
    optionSets: Array<{ id: string; options: SurveyOption[] }>;
    versioning?: { waveId?: string };
}

export type MatrixAnswer = Record<string, string>;
export type MultiSelectMatrixAnswer = Record<string, string[]>;
export type AnswerValue = string | string[] | number | MatrixAnswer | MultiSelectMatrixAnswer | undefined;
export type Answers = Record<string, AnswerValue>;
export type DetailAnswers = Record<string, string | undefined>;

export interface AnswerProgress {
    completed: number;
    total: number;
    complete: boolean;
}

export type AnswerStatus = "answered" | "partial" | "unanswered" | "notVisited";

export type QuestionNavigatorFilter = "All questions" | "Unanswered only";

export function detailAnswerKey(itemId: string, optionId: string): string {
    return `${itemId}::${optionId}`;
}

/** Use the versioned instrument order so every reportable item has a stable display number. */
export function surveyItemNumber(survey: SurveyDefinition, item: SurveyItem): number {
    const orderedItemIds = survey.sections.flatMap((section) => section.itemIds);
    return orderedItemIds.indexOf(item.id) + 1;
}

export function isAnswered(value: AnswerValue): boolean {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return value !== undefined && value !== "";
}

function hasAnswer(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== "" && value !== null;
}

/** Return completion at the level respondents see in a question. */
export function answerProgress(
    item: SurveyItem,
    value: AnswerValue,
): AnswerProgress {
    const isMatrix =
        item.kind === "matrixSingleSelect" ||
        (item.kind === "multiSelect" && item.layout === "matrix");
    const rows = isMatrix ? item.rows ?? [] : [];

    if (rows.length > 0) {
        const record =
            value && typeof value === "object" && !Array.isArray(value)
                ? (value as Record<string, unknown>)
                : {};
        const completed = rows.filter((row) => hasAnswer(record[row.id])).length;
        return {completed, total: rows.length, complete: completed === rows.length};
    }

    const completed = hasAnswer(value) ? 1 : 0;
    return {completed, total: 1, complete: completed === 1};
}

export function isItemAnswered(item: SurveyItem, value: AnswerValue): boolean {
    return answerProgress(item, value).complete;
}

export function matchesQuestionNavigatorFilter(
    item: SurveyItem,
    value: AnswerValue,
    filter: QuestionNavigatorFilter,
): boolean {
    return filter === "All questions" || !isItemAnswered(item, value);
}

export function answerStatus(
    item: SurveyItem,
    value: AnswerValue,
    visited: boolean,
): AnswerStatus {
    const progress = answerProgress(item, value);
    if (progress.complete) return "answered";
    if (progress.completed > 0) return "partial";
    return visited ? "unanswered" : "notVisited";
}

export function isSelectedOptionsDependent(item: SurveyItem): boolean {
    return item.optionSource?.type === "selectedOptions";
}

function allOptions(survey?: SurveyDefinition): SurveyOption[] {
    return survey?.optionSets.flatMap((set) => set.options) ?? [];
}

function selectedCount(
    itemId: string,
    tag: string | undefined,
    answers: Answers,
    survey?: SurveyDefinition,
): number {
    const selected = answers[itemId];
    const ids = Array.isArray(selected)
        ? selected
        : selected === undefined
            ? []
            : [selected];
    if (!tag) return ids.length;
    const options = allOptions(survey);
    return ids.filter((id) =>
        options.find((option) => option.id === id)?.tags?.includes(tag),
    ).length;
}

function expressionOperand(
    candidate: unknown,
    answers: Answers,
    survey?: SurveyDefinition,
): unknown {
    if (!candidate || typeof candidate !== "object") return candidate;
    const nested = candidate as SurveyExpression;
    if (nested.operator === "selectedCount")
        return selectedCount(nested.itemId ?? "", nested.tag, answers, survey);
    if (nested.operator === "itemId") return answers[nested.itemId ?? ""];
    return evaluateExpression(nested, answers, survey);
}

export function evaluateExpression(
    expression: SurveyExpression | undefined,
    answers: Answers,
    survey?: SurveyDefinition,
): boolean {
    if (!expression) return true;
    const args = expression.arguments ?? [];
    const value = expression.itemId ? answers[expression.itemId] : undefined;
    switch (expression.operator) {
        case "and":
            return args.every((arg) =>
                evaluateExpression(arg as SurveyExpression, answers, survey),
            );
        case "or":
            return args.some((arg) =>
                evaluateExpression(arg as SurveyExpression, answers, survey),
            );
        case "not":
            return !evaluateExpression(args[0] as SurveyExpression, answers, survey);
        case "answered":
            return isAnswered(value);
        case "selectedCount":
            return (
                selectedCount(
                    expression.itemId ?? "",
                    expression.tag,
                    answers,
                    survey,
                ) > 0
            );
        case "hasOption":
            return Array.isArray(value) && value.includes(expression.optionId ?? "");
        case "equals":
            return (
                expressionOperand(args[0], answers, survey) ===
                (expression.value !== undefined
                    ? expression.value
                    : expressionOperand(args[1], answers, survey))
            );
        case "in":
            return (
                Array.isArray(expressionOperand(args[1], answers, survey)) &&
                (expressionOperand(args[1], answers, survey) as unknown[]).includes(
                    expressionOperand(args[0], answers, survey),
                )
            );
        case "greaterThan":
            return (
                Number(expressionOperand(args[0], answers, survey) ?? value) >
                Number(expressionOperand(args[1], answers, survey) ?? expression.value)
            );
        case "lessThan":
            return (
                Number(expressionOperand(args[0], answers, survey) ?? value) <
                Number(expressionOperand(args[1], answers, survey) ?? expression.value)
            );
        default:
            return false;
    }
}

export function optionMatchesFilter(
    option: SurveyOption,
    filter: SurveyExpression | undefined,
): boolean {
    if (!filter) return true;
    const args = filter.arguments ?? [];
    switch (filter.operator) {
        case "equals":
            return filter.tag ? option.tags?.includes(filter.tag) === true : true;
        case "and":
            return args.every((arg) =>
                optionMatchesFilter(option, arg as SurveyExpression),
            );
        case "or":
            return args.some((arg) =>
                optionMatchesFilter(option, arg as SurveyExpression),
            );
        case "not":
            return !optionMatchesFilter(option, args[0] as SurveyExpression);
        case "hasOption":
            return option.id === filter.optionId;
        default:
            return false;
    }
}

export function resolveItemOptions(
    survey: SurveyDefinition,
    item: SurveyItem,
    answers: Answers,
): SurveyOption[] {
    if (
        item.optionSource?.type === "selectedOptions" &&
        item.optionSource.itemId
    ) {
        const sourceItem = survey.items.find(
            (candidate) => candidate.id === item.optionSource!.itemId,
        );
        const sourceOptions =
            survey.optionSets.find((set) => set.id === sourceItem?.optionSetRef)
                ?.options ?? [];
        const selected = answers[item.optionSource.itemId];
        const selectedIds = Array.isArray(selected)
            ? selected
            : selected === undefined
                ? []
                : [selected];
        const derived = sourceOptions.filter(
            (option) =>
                selectedIds.includes(option.id) &&
                optionMatchesFilter(option, item.optionSource?.filter),
        );
        const appended = (item.optionSource.appendOptionIds ?? []).flatMap((id) =>
            allOptions(survey).filter((option) => option.id === id),
        );
        return [
            ...derived,
            ...appended.filter(
                (option) => !derived.some((existing) => existing.id === option.id),
            ),
        ];
    }
    if (item.optionSetRef)
        return (
            survey.optionSets.find((set) => set.id === item.optionSetRef)?.options ??
            []
        );
    return [];
}

export function reconcileDependentAnswers(
    survey: SurveyDefinition,
    answers: Answers,
): void {
    for (const item of survey.items) {
        if (
            item.kind !== "singleSelect" ||
            item.optionSource?.type !== "selectedOptions"
        )
            continue;
        const options = resolveItemOptions(survey, item, answers);
        const visible = evaluateExpression(item.visibleWhen, answers, survey);
        const current = answers[item.id];
        if (
            !visible ||
            (typeof current === "string" &&
                !options.some((option) => option.id === current))
        )
            answers[item.id] = undefined;
    }
}

export function updateMultiSelectAnswer(
    current: string[],
    optionId: string,
    selected: boolean,
    options: SurveyOption[],
): string[] {
    if (!selected) return current.filter((id) => id !== optionId);
    const option = options.find((candidate) => candidate.id === optionId);
    if (!option) return current;
    if (option.selection?.exclusive) return [optionId];
    return [
        ...current.filter(
            (id) =>
                !options.find((candidate) => candidate.id === id)?.selection?.exclusive,
        ),
        optionId,
    ];
}

export function multiSelectValidationError(
    item: SurveyItem,
    value: string[] | undefined,
): string | undefined {
    const count = value?.length ?? 0;
    const min = item.validation?.minSelections ?? 0;
    const max = item.validation?.maxSelections;
    if (count < min)
        return `Select at least ${min} option${min === 1 ? "" : "s"}.`;
    if (max !== undefined && count > max)
        return `Select no more than ${max} option${max === 1 ? "" : "s"}.`;
    return undefined;
}

export function localized(
    value: LocalizedText | undefined,
    locale: string,
): string {
    if (!value) return "";
    return value[locale] ?? Object.values(value)[0] ?? "";
}

export function validateSurveyDefinition(value: unknown): SurveyDefinition {
    if (!value || typeof value !== "object")
        throw new Error("Survey definition must be an object.");
    const candidate = value as Partial<SurveyDefinition>;
    if (
        !candidate.id ||
        !candidate.version ||
        !candidate.defaultLocale ||
        !Array.isArray(candidate.sections) ||
        !Array.isArray(candidate.items)
    ) {
        throw new Error("Survey definition is missing required instrument fields.");
    }
    if (!candidate.title || typeof candidate.title !== "object")
        throw new Error("Survey definition requires a title.");
    if (!candidate.optionSets || !Array.isArray(candidate.optionSets))
        throw new Error("Survey definition requires option sets.");
    return candidate as SurveyDefinition;
}
