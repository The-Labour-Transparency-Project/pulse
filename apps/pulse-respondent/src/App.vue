<script lang="ts" setup>
import {computed} from "vue";
import {useSurveyExperience} from "./composables/useSurveyExperience";
import MobileNavigationDrawers from "./components/layout/MobileNavigationDrawers.vue";
import PanelResizeHandle from "./components/layout/PanelResizeHandle.vue";
import QuestionCanvas from "./components/layout/QuestionCanvas.vue";
import QuestionNavigator from "./components/layout/QuestionNavigator.vue";
import SectionRail from "./components/layout/SectionRail.vue";
import SurveyHeader from "./components/layout/SurveyHeader.vue";
import TipsGuidanceRail from "./components/layout/TipsGuidanceRail.vue";
import {useResizablePanels} from "./composables/useResizablePanels";

const experience = useSurveyExperience();
const {resizing, gridTemplateColumns, leftWidth, tipsWidth, startResize, nudge} = useResizablePanels();
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
  submitting,
  submissionError,
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
  verificationEmail, verificationCode, verificationRequested, verificationRequesting, verificationRequestMessage, verificationError, verificationVerified,
  setVerificationEmail, setVerificationCode,
  clearAnswers,
} = experience;
const workspaceColumns = computed(() => {
  return tipsOpen.value ? `${gridTemplateColumns.value} 8px ${tipsWidth.value}px` : gridTemplateColumns.value;
});
</script>

<template>
  <v-app>
    <SurveyHeader :answered-count="answeredCount" :is-dark="isDark" :submitted="Boolean(submission)" :tips-open="tipsOpen"
                  :verification-verified="verificationVerified"
                  :visible-count="visibleItems.length"
                  @open-navigation="leftOpen = !leftOpen"
                  @select-review="selectReview"
                  @toggle-tips="tipsOpen = !tipsOpen"
                  @toggle-theme="toggleTheme"/>
    <v-main class="workspace-bg workspace-shell">
      <MobileNavigationDrawers v-model:left-open="leftOpen" v-model:right-open="rightOpen" v-model:tips-open="tipsOpen"
                               :answers="answers"
                               :current-question-id="currentQuestion?.id" :destination="destination"
                               :items-by-id="itemsById"
                               :left-width="leftWidth"
                               :section-index="sectionIndex" :submitted="Boolean(submission)"
                               :survey="survey" :tips-width="tipsWidth"
                               :verification-code="verificationCode"
                               :verification-email="verificationEmail" :verification-error="verificationError"
                               :verification-requested="verificationRequested"
                               :verification-requesting="verificationRequesting" :verification-request-message="verificationRequestMessage"
                               :verification-verified="verificationVerified" :visible-items="visibleItems"
                               :visited-question-ids="visitedQuestionIds"
                               @select-introduction="selectIntroduction" @select-review="selectReview"
                               @select-outro="selectOutro"
                               @select-question="selectQuestion" @select-section="selectSection"
                               @update:email="setVerificationEmail" @update:code="setVerificationCode"
                               @request-code="verification.requestCode()" @confirm-code="verification.confirmCode()"
                               @use-another-email="verification.useAnotherEmail()"
                               @clear-verification="verification.clearVerification()"/>
      <div :class="['workspace-grid', { 'is-resizing': resizing }]"
           :style="{ gridTemplateColumns: workspaceColumns }">
        <SectionRail :answers="answers" :destination="destination" :section-answered="sectionAnswered"
                     :section-index="sectionIndex" :section-visible-count="sectionVisibleCount"
                     :submitted="Boolean(submission)"
                     :survey="survey" :view-mode="viewMode"
                     @select-introduction="selectIntroduction"
                     @select-review="selectReview" @select-outro="selectOutro"
                     @select-section="selectSection" @update-view="viewMode = $event"/>
        <PanelResizeHandle :resizing="resizing === 'left'" side="left"
                           @nudge="nudge('left', $event)" @resize="startResize('left', $event)"/>
        <QuestionCanvas :answer-options="answerOptions" :answered-count="answeredCount"
                        :answers="answers"
                        :can-go-previous="visibleItems.findIndex((item) => item.id === currentQuestion?.id) > 0"
                        :current-question-id="currentQuestion?.id"
                        :default-locale="survey.defaultLocale"
                        :destination="destination" :detail-answers="detailAnswers" :has-progress="answeredCount > 0"
                        :introduction="introduction" :item-number="itemNumber" :items-by-id="itemsById"
                        :outro="outro" :question-index="questionIndex" :row-answer-options="rowAnswerOptions"
                        :section="currentSection" :section-navigation-request="sectionNavigationRequest"
                        :show-introduction-in-continuous="showIntroductionInContinuous" :submitted="Boolean(submission)"
                        :submitting="submitting" :submission-error="submissionError"
                        :survey="survey"
                        :verification-code="verificationCode" :verification-email="verificationEmail"
                        :verification-error="verificationError"
                        :verification-requested="verificationRequested" :verification-requesting="verificationRequesting" :verification-request-message="verificationRequestMessage"
                        :verification-verified="verificationVerified"
                        :view-mode="viewMode" :visible-count="visibleItems.length"
                        :visible-items="visibleItems" @next="moveNext"
                        @previous="moveQuestion(-1)" @start="startSurvey"
                        @submit="submitResponse" @next-unanswered="findNextUnanswered"
                        @previous-unanswered="moveQuestion(-1, true)"
                        @question-in-view="setCurrentQuestionById" @update:email="setVerificationEmail"
                        @update:code="setVerificationCode" @request-code="verification.requestCode()"
                        @confirm-code="verification.confirmCode()"
                        @use-another-email="verification.useAnotherEmail()"
                        @clear-verification="verification.clearVerification()"
                        @clear-answers="clearAnswers" @return-to-survey="startSurvey"/>
        <PanelResizeHandle :resizing="resizing === 'right'" side="right"
                           @nudge="nudge('right', $event)" @resize="startResize('right', $event)"/>
        <QuestionNavigator :answers="answers"
                           :current-question-id="currentQuestion?.id"
                           :items-by-id="itemsById" :survey="survey" :visible-items="visibleItems"
                           :visited-question-ids="visitedQuestionIds"
                           @select-question="selectQuestion"/>
        <PanelResizeHandle v-if="tipsOpen" :resizing="resizing === 'tips'" side="tips"
                           @nudge="nudge('tips', $event)" @resize="startResize('tips', $event)"/>
        <TipsGuidanceRail v-if="tipsOpen" :verification-code="verificationCode"
                          :verification-email="verificationEmail" :verification-error="verificationError"
                          :verification-requested="verificationRequested" :verification-requesting="verificationRequesting" :verification-request-message="verificationRequestMessage"
                          :verification-verified="verificationVerified"
                          @update:email="setVerificationEmail" @update:code="setVerificationCode"
                          @request-code="verification.requestCode()" @confirm-code="verification.confirmCode()"
                          @use-another-email="verification.useAnotherEmail()"
                          @clear-verification="verification.clearVerification()"/>
      </div>
    </v-main>
    <v-snackbar v-model="copied" color="success">Response copied</v-snackbar>
  </v-app>
</template>
