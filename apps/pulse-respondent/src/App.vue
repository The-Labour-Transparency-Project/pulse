<script lang="ts" setup>
import { computed } from "vue";
import { useSurveyExperience } from "./composables/useSurveyExperience";
import MobileNavigationDrawers from "./components/layout/MobileNavigationDrawers.vue";
import PanelResizeHandle from "./components/layout/PanelResizeHandle.vue";
import QuestionCanvas from "./components/layout/QuestionCanvas.vue";
import QuestionNavigator from "./components/layout/QuestionNavigator.vue";
import SectionRail from "./components/layout/SectionRail.vue";
import SurveyHeader from "./components/layout/SurveyHeader.vue";
import TipsGuidanceRail from "./components/layout/TipsGuidanceRail.vue";
import { useResizablePanels } from "./composables/useResizablePanels";

const experience = useSurveyExperience();
const { resizing, gridTemplateColumns, leftWidth, tipsWidth, startResize, nudge } = useResizablePanels();
const {
  survey,
  answers,
  detailAnswers,
  itemsById,
  sectionIndex,
  questionIndex,
  viewMode,
  visitedQuestionIds,
  leftOpen,
  rightOpen,
  tipsOpen,
  destination,
  introduction,
  outro,
  submission,
  showIntroductionInContinuous,
  copied,
  isDark,
  visibleItems,
  answeredCount,
  currentSection,
  currentQuestion,
  sectionAnswered,
  sectionVisibleCount,
  itemNumber,
  answerOptions,
  rowAnswerOptions,
  sectionNavigationRequest,
  selectSection,
  selectQuestion,
  setCurrentQuestionById,
  moveQuestion,
  toggleTheme,
  findNextUnanswered,
  selectIntroduction,
  selectReview,
  selectOutro,
  startSurvey,
  moveNext,
  submitResponse,
  verification,
  verificationEmail, verificationCode, verificationRequested, verificationError, verificationVerified,
  setVerificationEmail, setVerificationCode,
  clearAnswers,
} = experience;
const workspaceColumns = computed(() => {
  return tipsOpen.value ? `${gridTemplateColumns.value} 8px ${tipsWidth.value}px` : gridTemplateColumns.value;
});
</script>

<template>
  <v-app>
    <SurveyHeader :answered-count="answeredCount" :is-dark="isDark" :tips-open="tipsOpen" :visible-count="visibleItems.length"
                  @open-navigation="leftOpen = !leftOpen"
                  @toggle-tips="tipsOpen = !tipsOpen"
                  @toggle-theme="toggleTheme" />
    <v-main class="workspace-bg workspace-shell">
      <MobileNavigationDrawers v-model:left-open="leftOpen" :left-width="leftWidth" v-model:right-open="rightOpen" :answers="answers"
                               v-model:tips-open="tipsOpen" :tips-width="tipsWidth" :destination="destination"
                               :submitted="Boolean(submission)"
                               :verification-email="verificationEmail" :verification-code="verificationCode"
                               :verification-requested="verificationRequested" :verification-error="verificationError"
                               :verification-verified="verificationVerified"
                               :current-question-id="currentQuestion?.id" :items-by-id="itemsById"
                               :section-index="sectionIndex" :survey="survey" :visible-items="visibleItems"
                               :visited-question-ids="visitedQuestionIds"
                               @select-introduction="selectIntroduction" @select-review="selectReview" @select-outro="selectOutro"
                               @select-question="selectQuestion" @select-section="selectSection"
                               @update:email="setVerificationEmail" @update:code="setVerificationCode"
                               @request-code="verification.requestCode()" @confirm-code="verification.confirmCode()"
                               @clear-verification="verification.clearVerification()" />
      <div :class="['workspace-grid', { 'is-resizing': resizing }]"
           :style="{ gridTemplateColumns: workspaceColumns }">
        <SectionRail :answers="answers" :section-answered="sectionAnswered" :section-index="sectionIndex"
                     :section-visible-count="sectionVisibleCount" :survey="survey" :view-mode="viewMode"
                     :destination="destination" :submitted="Boolean(submission)"
                     @select-introduction="selectIntroduction"
                     @select-review="selectReview" @select-outro="selectOutro"
                     @select-section="selectSection" @update-view="viewMode = $event" />
        <PanelResizeHandle :resizing="resizing === 'left'" side="left"
                           @nudge="nudge('left', $event)" @resize="startResize('left', $event)" />
        <QuestionCanvas :answer-options="answerOptions" :answers="answers"
                        :can-go-previous="visibleItems.findIndex((item) => item.id === currentQuestion?.id) > 0"
                        :current-question-id="currentQuestion?.id" :default-locale="survey.defaultLocale"
                        :detail-answers="detailAnswers"
                        :item-number="itemNumber" :items-by-id="itemsById" :question-index="questionIndex"
                        :row-answer-options="rowAnswerOptions" :section="currentSection" :destination="destination"
                        :introduction="introduction" :outro="outro" :has-progress="answeredCount > 0"
                        :answered-count="answeredCount" :visible-count="visibleItems.length"
                        :submitted="Boolean(submission)" :show-introduction-in-continuous="showIntroductionInContinuous"
                        :section-navigation-request="sectionNavigationRequest"
                        :survey="survey" :view-mode="viewMode"
                        :visible-items="visibleItems"
                        @next="moveNext" @previous="moveQuestion(-1)"
                        @next-unanswered="findNextUnanswered" @previous-unanswered="moveQuestion(-1, true)"
                        @question-in-view="setCurrentQuestionById" @start="startSurvey"
                        :verification-email="verificationEmail" :verification-code="verificationCode"
                        :verification-requested="verificationRequested" :verification-error="verificationError"
                        :verification-verified="verificationVerified"
                        @update:email="setVerificationEmail" @update:code="setVerificationCode"
                        @request-code="verification.requestCode()" @confirm-code="verification.confirmCode()"
                        @clear-verification="verification.clearVerification()"
                        @clear-answers="clearAnswers"
                        @return-to-survey="startSurvey" @submit="submitResponse" />
        <PanelResizeHandle :resizing="resizing === 'right'" side="right"
                           @nudge="nudge('right', $event)" @resize="startResize('right', $event)" />
        <QuestionNavigator :answers="answers"
                           :current-question-id="currentQuestion?.id"
                           :items-by-id="itemsById" :survey="survey" :visible-items="visibleItems"
                           :visited-question-ids="visitedQuestionIds"
                           @select-question="selectQuestion" />
        <PanelResizeHandle v-if="tipsOpen" :resizing="resizing === 'tips'" side="tips"
                           @nudge="nudge('tips', $event)" @resize="startResize('tips', $event)" />
        <TipsGuidanceRail v-if="tipsOpen" :verification-code="verificationCode"
                          :verification-email="verificationEmail" :verification-error="verificationError"
                          :verification-requested="verificationRequested" :verification-verified="verificationVerified"
                          @update:email="setVerificationEmail" @update:code="setVerificationCode"
                          @request-code="verification.requestCode()" @confirm-code="verification.confirmCode()"
                          @clear-verification="verification.clearVerification()" />
      </div>
    </v-main>
    <v-snackbar v-model="copied" color="success">Response copied</v-snackbar>
  </v-app>
</template>
