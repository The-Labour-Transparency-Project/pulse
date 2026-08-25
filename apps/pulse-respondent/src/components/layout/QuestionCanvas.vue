<script lang="ts" setup>
import { nextTick, onMounted, ref, watch, type ComponentPublicInstance } from "vue";
import { useDisplay } from "vuetify";
import SurveySection from "../SurveySection.vue";
import SurveyIntroduction from "../SurveyIntroduction.vue";
import SurveyOutro from "../SurveyOutro.vue";
import ReviewSubmit from "../ReviewSubmit.vue";
import SurveyNavigationControls from "./SurveyNavigationControls.vue";
import {
  type Answers,
  type DetailAnswers,
  type SurveyDefinition,
  type SurveyItem,
  type SurveySection as SurveySectionDefinition,
  type SurveyOption
} from "../../domain/survey";
import type { ViewMode } from "../../composables/useSurveyExperience";
import type { SectionNavigationRequest } from "../../composables/useSurveyExperience";
import type { SurveyDestination, SurveyIntroduction as SurveyIntroductionContent, SurveyOutro as SurveyOutroContent } from "../../domain/navigation";

const props = defineProps<{
  viewMode: ViewMode;
  survey: SurveyDefinition;
  section: SurveySectionDefinition;
  destination: SurveyDestination;
  introduction: SurveyIntroductionContent;
  outro: SurveyOutroContent;
  hasProgress: boolean;
  answeredCount: number;
  visibleCount: number;
  submitted: boolean;
  showIntroductionInContinuous: boolean;
  itemsById: Map<string, SurveyItem>;
  answers: Answers;
  detailAnswers: DetailAnswers;
  visibleItems: SurveyItem[];
  currentQuestionId?: string;
  defaultLocale: string;
  answerOptions: (item: SurveyItem) => SurveyOption[];
  rowAnswerOptions: (item: SurveyItem) => Record<string, SurveyOption[]>;
  questionIndex: number;
  sectionNavigationRequest: SectionNavigationRequest | null;
  itemNumber: (item: SurveyItem) => number;
  canGoPrevious: boolean
  verificationEmail: string;
  verificationCode: string;
  verificationRequested: boolean;
  verificationVerified: boolean;
  verificationError: string;
}>();
const emit = defineEmits<{
  previous: [];
  previousUnanswered: [];
  nextUnanswered: [];
  next: [];
  start: [];
  returnToSurvey: [];
  submit: [];
  questionInView: [id: string];
  "update:email": [value: string];
  "update:code": [value: string];
  requestCode: [];
  confirmCode: [];
  clearVerification: [];
  clearAnswers: [];
}>();
const card = ref<ComponentPublicInstance | null>(null);
const programmaticScroll = ref(false);
const interactionQuestionId = ref<string | null>(null);
const { xs } = useDisplay();

function cardElement() {
  return card.value?.$el instanceof HTMLElement ? card.value.$el : null;
}

function updateQuestionInView() {
  const element = cardElement();
  if (props.viewMode === "question" || !element) return;
  const cardTop = element.getBoundingClientRect().top;
  const questions = Array.from(element.querySelectorAll<HTMLElement>("[data-question-id]"))
    .filter((element) => element.offsetParent !== null);
  if (!questions.length) return;

  const current = questions.reduce<HTMLElement | undefined>((selected, question) => {
    const questionTop = question.getBoundingClientRect().top;
    return questionTop <= cardTop + 96 && (!selected || questionTop > selected.getBoundingClientRect().top)
      ? question
      : selected;
  }, undefined) ?? questions[0];
  const id = current.dataset.questionId;
  if (id) emit("questionInView", id);
}

function updateQuestionFromInteraction(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const question = target.closest<HTMLElement>("[data-question-id]");
  const id = question?.dataset.questionId;
  if (id) {
    interactionQuestionId.value = id;
    emit("questionInView", id);
    // If the interaction does not change the active question, clear the marker
    // before a later navigation event can accidentally consume it.
    nextTick(() => {
      if (interactionQuestionId.value === id) interactionQuestionId.value = null;
    });
  }
}

async function handleScroll() {
  await nextTick();
  if (programmaticScroll.value) return;
  updateQuestionInView();
}

async function bringCurrentQuestionIntoView(id?: string) {
  await nextTick();
  if (!id || props.viewMode === "question") return;
  const target = cardElement()?.querySelector<HTMLElement>(`[data-question-id="${id}"]`);
  if (!target) return;
  programmaticScroll.value = true;
  target.scrollIntoView({ block: "start", behavior: "auto" });
  requestAnimationFrame(() => {
    programmaticScroll.value = false;
  });
}

async function bringSelectedSectionIntoView(request: SectionNavigationRequest | null) {
  await nextTick();
  if (!request || !xs.value || props.viewMode !== "continuous") return;
  const target = cardElement()?.querySelector<HTMLElement>(`[data-section-index="${request.index}"]`);
  if (!target) return;
  programmaticScroll.value = true;
  target.scrollIntoView({ block: "start", behavior: "auto" });
  requestAnimationFrame(() => {
    programmaticScroll.value = false;
  });
}

async function bringDestinationIntoView(destination: SurveyDestination) {
  if (props.viewMode !== "continuous") return;
  await nextTick();
  const target = cardElement()?.querySelector<HTMLElement>(`[data-survey-destination="${destination.type}"]`);
  if (!target) return;
  programmaticScroll.value = true;
  target.scrollIntoView({ block: "start", behavior: "auto" });
  requestAnimationFrame(() => {
    programmaticScroll.value = false;
  });
}

onMounted(updateQuestionInView);
watch(() => [props.currentQuestionId, props.viewMode], ([id, mode], previous) => {
  const [previousId, previousMode] = previous ?? [];
  const changedFromInteraction = interactionQuestionId.value === id
    && id !== previousId
    && mode === previousMode;
  if (changedFromInteraction) {
    interactionQuestionId.value = null;
    return;
  }
  interactionQuestionId.value = null;
  bringCurrentQuestionIntoView(id);
}, { immediate: true });
watch(() => props.sectionNavigationRequest?.token, () => {
  bringSelectedSectionIntoView(props.sectionNavigationRequest);
});
watch(() => props.destination.type, (type) => {
  if (type === "introduction" || type === "review" || type === "outro") {
    bringDestinationIntoView(props.destination);
  }
});
</script>

<template>
  <section class="question-canvas pa-3 pa-md-4">
    <div class="question-card-shell" @click="updateQuestionFromInteraction" @focusin="updateQuestionFromInteraction">
      <v-card ref="card" class="question-card" elevation="1" rounded="lg" @scroll.passive="handleScroll">
      <template v-if="viewMode === 'continuous'">
        <div v-if="showIntroductionInContinuous" class="continuous-destination"
             data-survey-destination="introduction">
          <SurveyIntroduction :has-progress="hasProgress" :introduction="introduction" :verified="verificationVerified"
                              @start="$emit('start')" @clear-answers="$emit('clearAnswers')" />
        </div>
        <template v-for="surveySection in survey.sections" :key="surveySection.id">
          <SurveySection
              :answer-options="answerOptions"
              :answers="answers"
              :default-locale="defaultLocale"
              :detail-answers="detailAnswers"
              :item-number="itemNumber"
              :items-by-id="itemsById"
              :row-answer-options="rowAnswerOptions"
              :section="surveySection"
              :survey="survey"
              :visible-items="visibleItems"
          />
        </template>
        <div v-if="!submitted" class="continuous-destination" data-survey-destination="review">
          <ReviewSubmit :answered-count="answeredCount" :show-return-button="false" :visible-count="visibleCount"
                        :email="verificationEmail" :code="verificationCode" :requested="verificationRequested"
                        :verified="verificationVerified" :verification-error="verificationError"
                        @update:email="$emit('update:email', $event)" @update:code="$emit('update:code', $event)"
                        @request-code="$emit('requestCode')" @confirm-code="$emit('confirmCode')"
                        @clear-verification="$emit('clearVerification')"
                        @clear-answers="$emit('clearAnswers')"
                        @return-to-survey="$emit('returnToSurvey')" @submit="$emit('submit')" />
        </div>
        <div v-if="submitted" class="continuous-destination" data-survey-destination="outro">
          <SurveyOutro :answered-count="answeredCount" :outro="outro" :show-return-button="false" :submitted="submitted"
                        :verified="verificationVerified" :visible-count="visibleCount"
                       @return-to-survey="$emit('returnToSurvey')" @clear-answers="$emit('clearAnswers')"
                       @clear-verification="$emit('clearVerification')" />
        </div>
      </template>
      <SurveyIntroduction v-else-if="destination.type === 'introduction'" :has-progress="hasProgress"
                          :introduction="introduction" :verified="verificationVerified"
                          @start="$emit('start')" @clear-answers="$emit('clearAnswers')" />
      <ReviewSubmit v-else-if="destination.type === 'review' && !submitted" :answered-count="answeredCount"
                    :show-return-button="true" :visible-count="visibleCount"
                    :email="verificationEmail" :code="verificationCode" :requested="verificationRequested"
                    :verified="verificationVerified" :verification-error="verificationError"
                    @update:email="$emit('update:email', $event)" @update:code="$emit('update:code', $event)"
                    @request-code="$emit('requestCode')" @confirm-code="$emit('confirmCode')"
                    @clear-verification="$emit('clearVerification')"
                    @clear-answers="$emit('clearAnswers')"
                    @return-to-survey="$emit('returnToSurvey')"
                    @submit="$emit('submit')" />
      <SurveyOutro v-else-if="destination.type === 'outro' && submitted" :answered-count="answeredCount"
                   :outro="outro" :show-return-button="true" :submitted="submitted"
                   :verified="verificationVerified" :visible-count="visibleCount"
                   @return-to-survey="$emit('returnToSurvey')" @clear-answers="$emit('clearAnswers')"
                   @clear-verification="$emit('clearVerification')" />
      <SurveySection
          v-else
          :answer-options="answerOptions"
          :answers="answers"
          :default-locale="defaultLocale"
          :detail-answers="detailAnswers"
          :item-number="itemNumber"
          :items-by-id="itemsById"
          :question-index="viewMode === 'question' ? questionIndex : undefined"
          :row-answer-options="rowAnswerOptions"
          :section="section"
          :survey="survey"
          :visible-items="visibleItems"
      />
      </v-card>
    </div>
    <SurveyNavigationControls v-if="destination.type === 'question'" :can-go-previous="canGoPrevious" @next="$emit('next')" @previous="$emit('previous')"
                              @next-unanswered="$emit('nextUnanswered')"
                              @previous-unanswered="$emit('previousUnanswered')" />
  </section>
</template>

<style scoped>
.question-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  max-width: 920px;
  width: 100%;
  margin: 0 auto;
}

.question-card {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
}

.question-card-shell {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}

.survey-tip {
  width: calc(100% - 8px);
}

.continuous-destination :deep(.introduction-canvas),
.continuous-destination :deep(.review-canvas),
.continuous-destination :deep(.outro-canvas) {
  min-height: auto;
}

.continuous-destination :deep(.introduction-card),
.continuous-destination :deep(.review-card),
.continuous-destination :deep(.outro-card) {
  margin-top: 0;
}

@media (max-width: 1279px) {
  .question-canvas {
    height: auto;
    max-width: 760px;
  }

  .question-card {
    min-height: 620px;
  }
}

@media (max-width: 599px) {
  .question-canvas {
    padding: 32px 12px 76px !important;
  }

  .question-card {
    min-height: 0;
    border: 0;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
}
</style>
