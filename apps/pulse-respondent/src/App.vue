<script lang="ts" setup>
import { ref } from "vue";
import { useSurveyExperience } from "./composables/useSurveyExperience";
import MobileNavigationDrawers from "./components/layout/MobileNavigationDrawers.vue";
import PanelResizeHandle from "./components/layout/PanelResizeHandle.vue";
import QuestionCanvas from "./components/layout/QuestionCanvas.vue";
import QuestionNavigator from "./components/layout/QuestionNavigator.vue";
import SectionRail from "./components/layout/SectionRail.vue";
import SurveyHeader from "./components/layout/SurveyHeader.vue";
import { useResizablePanels } from "./composables/useResizablePanels";

const experience = useSurveyExperience();
const showTip = ref(true);
const { resizing, gridTemplateColumns, questionNavigatorHidden, startResize, nudge } = useResizablePanels();
const {
  survey, answers, detailAnswers, itemsById, sectionIndex, questionIndex, viewMode,
  visitedQuestionIds,
  leftOpen, rightOpen, copied, isDark, visibleItems, answeredCount, currentSection,
  currentQuestion, sectionAnswered, sectionVisibleCount, itemNumber, answerOptions,
  rowAnswerOptions, sectionNavigationRequest, selectSection, selectQuestion, setCurrentQuestionById, moveQuestion, toggleTheme,
  findNextUnanswered, copySerializedResponse,
} = experience;
</script>

<template>
  <v-app>
    <SurveyHeader :answered-count="answeredCount" :is-dark="isDark" :visible-count="visibleItems.length"
                  @open-navigation="leftOpen = true"
                  @toggle-theme="toggleTheme" />
    <v-main class="workspace-bg workspace-shell">
      <MobileNavigationDrawers v-model:left-open="leftOpen" v-model:right-open="rightOpen" :answers="answers"
                               :current-question-id="currentQuestion?.id" :items-by-id="itemsById"
                               :section-index="sectionIndex" :survey="survey" :visible-items="visibleItems"
                               :visited-question-ids="visitedQuestionIds"
                               @select-question="selectQuestion" @select-section="selectSection" />
      <div :class="['workspace-grid', { 'is-resizing': resizing }]" :style="{ gridTemplateColumns: questionNavigatorHidden ? gridTemplateColumns.replace(/\d+px$/, '48px') : gridTemplateColumns }">
        <SectionRail :answers="answers" :section-answered="sectionAnswered" :section-index="sectionIndex"
                     :section-visible-count="sectionVisibleCount" :survey="survey" :view-mode="viewMode"
                     @select-section="selectSection" @update-view="viewMode = $event" />
        <PanelResizeHandle :resizing="resizing === 'left'" side="left"
                           @nudge="nudge('left', $event)" @resize="startResize('left', $event)" />
        <QuestionCanvas :answer-options="answerOptions" :answers="answers" :can-go-previous="visibleItems.findIndex((item) => item.id === currentQuestion?.id) > 0"
                        :current-question-id="currentQuestion?.id" :default-locale="survey.defaultLocale" :detail-answers="detailAnswers"
                        :item-number="itemNumber" :items-by-id="itemsById" :question-index="questionIndex"
                        :row-answer-options="rowAnswerOptions" :section="currentSection"
                        :section-navigation-request="sectionNavigationRequest"
                        :survey="survey" :view-mode="viewMode"
                        :visible-items="visibleItems"
                        @next="moveQuestion(1)" @previous="moveQuestion(-1)"
                        @next-unanswered="findNextUnanswered" @previous-unanswered="moveQuestion(-1, true)"
                        @question-in-view="setCurrentQuestionById" />
        <PanelResizeHandle :resizing="resizing === 'right'" side="right"
                           @nudge="nudge('right', $event)" @resize="startResize('right', $event)" />
        <QuestionNavigator :answers="answers" :current-question-id="currentQuestion?.id" :items-by-id="itemsById"
                           :survey="survey" :visible-items="visibleItems" :visited-question-ids="visitedQuestionIds"
                           v-model:hidden="questionNavigatorHidden"
                           @select-question="selectQuestion" />
      </div>
      <v-alert v-if="showTip" v-model="showTip" class="survey-tip" closable color="primary"
               density="compact" icon="mdi-information-outline" variant="tonal">
        Tip: Use the navigator to jump to any question&nbsp; · &nbsp;Use the navigation controls to move through the
        survey&nbsp; · &nbsp;Use arrow keys to navigate through the survey.
      </v-alert>
    </v-main>
    <v-snackbar v-model="copied" color="success">Response copied</v-snackbar>
  </v-app>
</template>
