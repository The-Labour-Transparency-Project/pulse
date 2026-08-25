import { computed, reactive, ref, watch } from "vue";
import { useDisplay, useTheme } from "vuetify";
import definitionJson from "../../../../surveys/labour-transparency-pulse/v1/definition.json";
import { useClipboard, useEventListener, useLocalStorage } from "@vueuse/core";
import { serializeSurveyResponse } from "../domain/response";
import {
    draftStorageKey,
    draftStorageSerializer,
    createJsonStorageSerializer,
    destinationStorageKey,
    isViewMode,
    parseSurveyDraft,
    parseSurveyDestination,
    parseSurveyPosition,
    positionStorageKey,
    type SurveyDraft,
} from "../domain/draft";
import {
    type Answers,
    type DetailAnswers,
    evaluateExpression,
    isItemAnswered,
    reconcileDependentAnswers,
    resolveItemOptions,
    type SurveyItem,
    surveyItemNumber,
    validateSurveyDefinition,
} from "../domain/survey";
import { introductionFor, outroFor, type SurveyDestination } from "../domain/navigation";
import { useVerification } from "./useVerification";

export type ViewMode = "continuous" | "sections" | "question";
export type SectionNavigationRequest = { index: number; token: number };

const viewModeStorageKey = "pulse-respondent-view-mode";

export function useSurveyExperience() {
    const theme = useTheme();
    const { xs } = useDisplay();
    const survey = validateSurveyDefinition(definitionJson);
    const verification = useVerification(survey.id, survey.version);
    const verificationEmail = verification.email;
    const verificationCode = verification.code;
    const verificationRequested = verification.requested;
    const verificationError = verification.error;
    const verificationVerified = verification.verified;
    const answers = reactive<Answers>({});
    const detailAnswers = reactive<DetailAnswers>({});
    const storedDraft = useLocalStorage<SurveyDraft | null>(draftStorageKey(survey), null, {
        serializer: draftStorageSerializer,
    });
    const hydratedDraft = parseSurveyDraft(storedDraft.value, survey);
    const storedViewMode = useLocalStorage<ViewMode | null>(viewModeStorageKey, null);
    const storedPosition = useLocalStorage<{ sectionIndex: number; questionIndex: number } | null>(
        positionStorageKey(survey),
        null,
        { serializer: createJsonStorageSerializer<{ sectionIndex: number; questionIndex: number }>() },
    );
    const storedDestination = useLocalStorage<SurveyDestination | null>(destinationStorageKey(survey), null, {
        serializer: createJsonStorageSerializer<SurveyDestination>(),
    });
    const storedSubmission = useLocalStorage<ReturnType<typeof serializeSurveyResponse> | null>(
        `pulse-respondent-submission:${survey.id}:${survey.version}`,
        null,
        { serializer: createJsonStorageSerializer<ReturnType<typeof serializeSurveyResponse>>() },
    );
    const preferredViewMode = isViewMode(storedViewMode.value)
        ? storedViewMode.value
        : hydratedDraft?.viewMode;
    // The draft contains the answer state and progress from the same write. Use
    // it first so an older standalone position key cannot move the respondent
    // away from the location captured in the latest draft.
    const preferredPosition = hydratedDraft
        ? { sectionIndex: hydratedDraft.sectionIndex, questionIndex: hydratedDraft.questionIndex }
        : parseSurveyPosition(storedPosition.value, survey);
    if (hydratedDraft) {
        Object.assign(answers, hydratedDraft.answers);
        Object.assign(detailAnswers, hydratedDraft.detailAnswers);
    }
    const itemsById = new Map(survey.items.map((item) => [item.id, item]));
    const sectionIndex = ref(preferredPosition?.sectionIndex ?? 0);
    const questionIndex = ref(preferredPosition?.questionIndex ?? 0);
    const destination = ref<SurveyDestination>({ type: "introduction" });
    const showIntroductionInContinuous = ref(true);
    const visitedQuestionIds = reactive(new Set<string>(hydratedDraft?.visitedQuestionIds ?? []));
    const viewMode = ref<ViewMode>(preferredViewMode ?? "question");
    const viewModeBeforeXs = ref<ViewMode>(viewMode.value);
    const xsModeForced = ref(false);
    const leftOpen = ref(false);
    const rightOpen = ref(false);
    const tipsOpen = ref(false);
    const submission = ref<ReturnType<typeof serializeSurveyResponse> | null>(storedSubmission.value);
    const restoredDestination = parseSurveyDestination(storedDestination.value, survey);
    if (restoredDestination) {
        destination.value = restoredDestination;
        showIntroductionInContinuous.value = restoredDestination.type === "introduction";
    }
    const sectionNavigationRequest = ref<SectionNavigationRequest | null>(null);
    let sectionNavigationToken = 0;
    const { copy, copied, isSupported } = useClipboard();

    watch(xs, (isXs) => {
        if (isXs) {
            viewModeBeforeXs.value = viewMode.value;
            viewMode.value = "continuous";
            xsModeForced.value = true;
        } else if (xsModeForced.value) {
            viewMode.value = viewModeBeforeXs.value;
            xsModeForced.value = false;
        }
    }, { immediate: true });

    watch(viewMode, (mode) => {
        if (xs.value && mode !== "continuous") {
            viewMode.value = "continuous";
            return;
        }
        if (!xs.value) {
            viewModeBeforeXs.value = mode;
            storedViewMode.value = mode;
        }
    });

    const storedTheme = localStorage.getItem("pulse-respondent-theme");
    if (storedTheme === "dark" || storedTheme === "light") theme.change(storedTheme);

    const isDark = computed(() => theme.global.name.value === "dark");
    const visibleItems = computed(() => survey.sections.flatMap((section) => section.itemIds
        .map((id) => itemsById.get(id))
        .filter((item): item is SurveyItem => !!item && evaluateExpression(item.visibleWhen, answers, survey))));
    const answeredCount = computed(() => visibleItems.value.filter((item) => isItemAnswered(item, answers[item.id])).length);
    const currentSection = computed(() => survey.sections[sectionIndex.value]);
    const currentItems = computed(() => (currentSection.value?.itemIds ?? [])
        .map((id) => itemsById.get(id))
        .filter((item): item is SurveyItem => !!item && visibleItems.value.includes(item)));
    const currentQuestion = computed(() => currentItems.value[questionIndex.value]);
    const introduction = computed(() => introductionFor(survey));
    const outro = computed(() => outroFor(survey));

    watch(currentItems, (items) => {
        if (!items.length) {
            questionIndex.value = 0;
        } else if (questionIndex.value >= items.length) {
            questionIndex.value = items.length - 1;
        }
    }, { immediate: true });

    watch([sectionIndex, questionIndex], ([section, question]) => {
        storedPosition.value = { sectionIndex: section, questionIndex: question };
    }, { immediate: true });

    watch(destination, (value) => {
        storedDestination.value = value;
    }, { deep: true, immediate: true });

    watch(
        () => currentQuestion.value?.id,
        (id) => {
            if (id) visitedQuestionIds.add(id);
        },
        { immediate: true },
    );

    const sectionAnswered = (sectionId: string) => {
        const section = survey.sections.find((candidate) => candidate.id === sectionId);
        return section?.itemIds.filter((id) => {
            const item = itemsById.get(id);
            return item ? isItemAnswered(item, answers[id]) : false;
        }).length ?? 0;
    };
    const sectionVisibleCount = (sectionId: string) => {
        const section = survey.sections.find((candidate) => candidate.id === sectionId);
        return section?.itemIds.filter((id) => visibleItems.value.some((item) => item.id === id)).length ?? 0;
    };
    const itemNumber = (item: SurveyItem) => surveyItemNumber(survey, item);
    const answerOptions = (item: SurveyItem) => resolveItemOptions(survey, item, answers);
    const rowAnswerOptions = (item: SurveyItem) => Object.fromEntries(
        (item.rows ?? []).map((row) => [row.id, survey.optionSets.find((set) => set.id === row.optionSetRef)?.options ?? []]),
    );

    function selectSection(index: number) {
        sectionIndex.value = index;
        questionIndex.value = 0;
        destination.value = { type: "question", sectionId: survey.sections[index]?.id ?? "" };
        showIntroductionInContinuous.value = false;
        sectionNavigationRequest.value = { index, token: ++sectionNavigationToken };
        leftOpen.value = false;
    }

    function selectIntroduction() {
        destination.value = { type: "introduction" };
        showIntroductionInContinuous.value = true;
        leftOpen.value = false;
    }

    function selectOutro() {
        if (!submission.value) {
            selectReview();
            return;
        }
        destination.value = { type: "outro" };
        showIntroductionInContinuous.value = false;
        leftOpen.value = false;
    }

    function selectReview() {
        destination.value = { type: "review" };
        showIntroductionInContinuous.value = false;
        leftOpen.value = false;
    }

    function startSurvey() {
        showIntroductionInContinuous.value = false;
        const firstUnanswered = visibleItems.value.find((item) => !isItemAnswered(item, answers[item.id]));
        if (firstUnanswered) {
            setCurrentQuestionById(firstUnanswered.id);
        } else {
            setQuestionPosition(sectionIndex.value, questionIndex.value);
        }
    }

    function setQuestionPosition(section: number, item: number) {
        sectionIndex.value = section;
        questionIndex.value = item;
        destination.value = {
            type: "question",
            sectionId: survey.sections[section]?.id ?? "",
            questionId: survey.sections[section]?.itemIds[item],
        };
    }

    function selectQuestion(section: number, item: number) {
        const selectedId = survey.sections[section]?.itemIds[item];
        const visibleItem = survey.sections[section]?.itemIds
            .map((id) => itemsById.get(id))
            .filter((candidate): candidate is SurveyItem => !!candidate && visibleItems.value.includes(candidate))
            .findIndex((candidate) => candidate.id === selectedId) ?? -1;
        if (visibleItem < 0) return;
        setQuestionPosition(section, visibleItem);
        rightOpen.value = false;
    }

    function setCurrentQuestionById(id: string) {
        const section = survey.sections.findIndex((candidate) => candidate.itemIds.includes(id));
        if (section < 0) return;
        const visibleSectionItems = survey.sections[section].itemIds
            .map((itemId) => itemsById.get(itemId))
            .filter((item): item is SurveyItem => !!item && visibleItems.value.includes(item));
        const item = visibleSectionItems.findIndex((candidate) => candidate.id === id);
        if (item < 0) return;
        setQuestionPosition(section, item);
    }

    function moveQuestion(direction: 1 | -1, unansweredOnly = false) {
        const list = visibleItems.value;
        const current = currentQuestion.value ? list.findIndex((item) => item.id === currentQuestion.value!.id) : -1;
        const candidate = direction === 1
            ? list.find((item, index) => index > current && (!unansweredOnly || !isItemAnswered(item, answers[item.id])))
            : [...list].reverse().find((item) => list.findIndex((candidateItem) => candidateItem.id === item.id) < current && (!unansweredOnly || !isItemAnswered(item, answers[item.id])));
        if (!candidate) return false;
        const section = survey.sections.findIndex((item) => item.itemIds.includes(candidate.id));
        setQuestionPosition(section, survey.sections[section].itemIds
            .map((id) => itemsById.get(id))
            .filter((item): item is SurveyItem => !!item && visibleItems.value.includes(item))
            .findIndex((item) => item.id === candidate.id));
        return true;
    }

    function moveNext() {
        if (moveQuestion(1)) return true;
        if (destination.value.type === "question") {
            selectReview();
            return true;
        }
        return false;
    }

    function submitResponse() {
        if (!verification.verified.value) return null;
        submission.value = serializeSurveyResponse(survey, answers, detailAnswers, {
            completionStatus: answeredCount.value === visibleItems.value.length ? "complete" : "partial",
        });
        storedSubmission.value = submission.value;
        selectOutro();
        return submission.value;
    }

    function setVerificationEmail(value: string) { verification.email.value = value; }
    function setVerificationCode(value: string) { verification.code.value = value; }

    function clearAnswers() {
        Object.keys(answers).forEach((id) => delete answers[id]);
        Object.keys(detailAnswers).forEach((id) => delete detailAnswers[id]);
        visitedQuestionIds.clear();
        submission.value = null;
        storedSubmission.value = null;
    }

    useEventListener("keydown", (event) => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const target = event.target as HTMLElement | null;
        if (target?.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target?.tagName ?? "")) return;

        const moved = event.key === "ArrowLeft"
            ? moveQuestion(-1)
            : event.key === "ArrowRight"
                ? moveQuestion(1)
                : event.key === "ArrowUp"
                    ? moveQuestion(-1, true)
                    : event.key === "ArrowDown"
                        ? moveQuestion(1, true)
                        : false;

        if (moved) event.preventDefault();
    });

    function toggleTheme() {
        const next = isDark.value ? "light" : "dark";
        theme.change(next);
        localStorage.setItem("pulse-respondent-theme", next);
    }

    async function copySerializedResponse() {
        if (!isSupported.value) return false;
        try {
            await copy(JSON.stringify(serializeSurveyResponse(survey, answers, detailAnswers, { completionStatus: "partial" }), null, 2));
            return true;
        } catch {
            return false;
        }
    }

    watch(answers, () => reconcileDependentAnswers(survey, answers), { deep: true, immediate: true });

    watch([answers, detailAnswers], () => {
        if (!submission.value) return;
        submission.value = null;
        storedSubmission.value = null;
        if (destination.value.type === "outro") selectReview();
    }, { deep: true });

    watch([answers, detailAnswers, sectionIndex, questionIndex, viewMode, () => [...visitedQuestionIds]], () => {
        storedDraft.value = {
            surveyId: survey.id,
            surveyVersion: survey.version,
            answers: JSON.parse(JSON.stringify(answers)) as Answers,
            detailAnswers: JSON.parse(JSON.stringify(detailAnswers)) as DetailAnswers,
            sectionIndex: sectionIndex.value,
            questionIndex: questionIndex.value,
            viewMode: viewMode.value,
            visitedQuestionIds: [...visitedQuestionIds],
        };
    }, { deep: true });

    return {
        survey, answers, detailAnswers, itemsById, sectionIndex, questionIndex, viewMode, destination, introduction, outro,
        visitedQuestionIds,
        leftOpen, rightOpen, copied, isDark, visibleItems, answeredCount, currentSection,
        tipsOpen, submission, showIntroductionInContinuous,
        currentQuestion, sectionAnswered, sectionVisibleCount, itemNumber, answerOptions, sectionNavigationRequest,
        rowAnswerOptions, selectSection, selectIntroduction, selectReview, selectOutro, startSurvey, selectQuestion, setCurrentQuestionById, moveQuestion, moveNext, submitResponse, toggleTheme,
        verification,
        verificationEmail, verificationCode, verificationRequested, verificationError, verificationVerified,
        setVerificationEmail, setVerificationCode,
        clearAnswers,
        findNextUnanswered: () => moveQuestion(1, true), copySerializedResponse,
    };
}
