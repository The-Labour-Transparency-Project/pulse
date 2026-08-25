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
const { resizing, gridTemplateColumns, questionNavigatorHidden, startResize, nudge } = useResizablePanels();
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
} = experience;
const workspaceColumns = computed(() => {
  const columns = questionNavigatorHidden.value ? gridTemplateColumns.value.replace(/\d+px$/, "48px") : gridTemplateColumns.value;
  return tipsOpen.value ? columns.replace(/(\d+)px$/, "$1px 280px") : columns;
});
</script>

<template>
  <v-app>
    <SurveyHeader :answered-count="answeredCount" :is-dark="isDark" :tips-open="tipsOpen" :visible-count="visibleItems.length"
                  @open-navigation="leftOpen = true"
                  @toggle-tips="tipsOpen = !tipsOpen"
                  @toggle-theme="toggleTheme" />
    <v-main class="workspace-bg workspace-shell">
      <MobileNavigationDrawers v-model:left-open="leftOpen" v-model:right-open="rightOpen" :answers="answers"
                               v-model:tips-open="tipsOpen" :destination="destination" :submitted="Boolean(submission)"
                               :current-question-id="currentQuestion?.id" :items-by-id="itemsById"
                               :section-index="sectionIndex" :survey="survey" :visible-items="visibleItems"
                               :visited-question-ids="visitedQuestionIds"
                               @select-introduction="selectIntroduction" @select-review="selectReview" @select-outro="selectOutro"
                               @select-question="selectQuestion" @select-section="selectSection" />
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
                        @return-to-survey="startSurvey" @submit="submitResponse" />
        <PanelResizeHandle :resizing="resizing === 'right'" side="right"
                           @nudge="nudge('right', $event)" @resize="startResize('right', $event)" />
        <QuestionNavigator v-model:hidden="questionNavigatorHidden" :answers="answers"
                           :current-question-id="currentQuestion?.id"
                           :items-by-id="itemsById" :survey="survey" :visible-items="visibleItems"
                           :visited-question-ids="visitedQuestionIds"
                           @select-question="selectQuestion" />
        <TipsGuidanceRail v-if="tipsOpen" />
      </div>
    </v-main>
    <v-snackbar v-model="copied" color="success">Response copied</v-snackbar>
  </v-app>
</template>
