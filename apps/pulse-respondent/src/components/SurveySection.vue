<script lang="ts" setup>
import { computed } from "vue";
import QuestionRenderer from "./QuestionRenderer.vue";
import {
  evaluateExpression,
  isAnswered,
  isSelectedOptionsDependent,
  localized,
  type Answers,
  type DetailAnswers,
  type SurveyDefinition,
  type SurveyItem,
  type SurveyOption,
  type SurveySection as SurveySectionDefinition,
} from "../domain/survey";

const props = defineProps<{
  section: SurveySectionDefinition;
  itemsById: Map<string, SurveyItem>;
  answers: Answers;
  detailAnswers: DetailAnswers;
  defaultLocale: string;
  survey: SurveyDefinition;
  answerOptions: (item: SurveyItem) => SurveyOption[];
  rowAnswerOptions: (item: SurveyItem) => Record<string, SurveyOption[]>;
  questionIndex?: number;
  visibleItems: SurveyItem[];
  itemNumber: (item: SurveyItem) => number;
}>();

function isItemAvailable(
    item: SurveyItem,
    answers: Answers,
    survey: SurveyDefinition,
) {
  return evaluateExpression(item.visibleWhen, answers, survey);
}

const visibleQuestionIds = computed(() => props.section.itemIds.filter((id) =>
  props.visibleItems.some((item) => item.id === id),
));
</script>

<template>
  <v-card-item :data-section-index="survey.sections.findIndex((candidate) => candidate.id === section.id)" class="section-anchor px-4 px-md-6 pt-5 pb-2">
    <div class="d-flex align-center ga-2 mb-2">
      <v-chip class="ui-badge" color="primary" rounded="4" size="small" variant="tonal">Section
        {{ survey.sections.findIndex((candidate) => candidate.id === section.id) + 1 }} of {{ survey.sections.length }}
      </v-chip>
      <!--
      <span class="ui-metadata text-medium-emphasis">{{
          section.itemIds.filter((id) => isAnswered(answers[id])).length
        }} / {{ section.itemIds.length }} answered
      </span>
      -->
    </div>
    <v-card-title class="survey-section-title px-0">
      {{ localized(section.title, defaultLocale) }}
    </v-card-title>
    <v-card-subtitle v-if="section.description" class="survey-section-description px-0">
      {{ localized(section.description, defaultLocale) }}
    </v-card-subtitle>
  </v-card-item>
  <!--  <v-divider />-->
  <v-card-text class="px-4 px-md-6 pt-2 pb-5">
    <section
        v-for="(itemId, index) in section.itemIds"
        v-show="props.questionIndex === undefined || visibleQuestionIds.indexOf(itemId) === props.questionIndex"
        :key="itemId"
        :data-question-id="itemId"
    >
      <template
          v-if="
            itemsById.get(itemId) &&
            (isItemAvailable(itemsById.get(itemId)!, answers, survey) ||
              isSelectedOptionsDependent(itemsById.get(itemId)!))
          "
      >
        <div
            :class="[
              'question-layout',
              { 'opacity-60': !isItemAvailable(itemsById.get(itemId)!, answers, survey) },
            ]"
        >
          <div class="question-badge-region">
            <v-chip class="ui-badge" color="primary" rounded="4" size="small" variant="tonal">
              Q{{ itemNumber(itemsById.get(itemId)!) }}
            </v-chip>
          </div>
          <div class="question-content">
            <div class="mb-2">
              <h2 class="survey-question mb-1">
                {{ localized(itemsById.get(itemId)!.title, defaultLocale) }}
                <v-tooltip v-if="localized(itemsById.get(itemId)!.description, defaultLocale)" location="top">
                  <template #activator="{ props: tooltipProps }">
                    <v-icon
                        class="question-info-icon text-medium-emphasis"
                        icon="mdi-information-outline"
                        size="18"
                        v-bind="tooltipProps"
                    />
                  </template>
                  {{ localized(itemsById.get(itemId)!.description, defaultLocale) }}
                </v-tooltip>
              </h2>
            </div>
            <p
                v-if="localized(itemsById.get(itemId)!.instruction, defaultLocale)"
                :id="`${itemId}-instruction`"
                class="survey-instruction mb-2"
            >
              {{ localized(itemsById.get(itemId)!.instruction, defaultLocale) }}
            </p>
            <QuestionRenderer
                v-if="isItemAvailable(itemsById.get(itemId)!, answers, survey)"
                :answers="answers"
                :detail-answers="detailAnswers"
                :item="itemsById.get(itemId)!"
                :options="answerOptions(itemsById.get(itemId)!)"
                :row-options="rowAnswerOptions(itemsById.get(itemId)!)"
            />
            <v-alert
                v-else
                class="mt-3"
                density="compact"
                type="info"
                variant="tonal"
            >
              This question depends on the answer above and is not applicable
              with the current selection.
            </v-alert>
          </div>
        </div>
      </template>
    </section>
  </v-card-text>
</template>

<style scoped>
.question-layout {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 12px;
  align-items: start;
}

.question-badge-region {
  /* Align the chip's visual center with the first line of the question title. */
  padding-top: 10px;
}

.question-content {
  min-width: 0;
}

.question-info-icon {
  vertical-align: -2px;
  margin-inline-start: 6px;
}

.survey-section-description {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

@media (max-width: 599px) {
  .section-anchor {
    scroll-margin-top: 120px;
  }
}
</style>
