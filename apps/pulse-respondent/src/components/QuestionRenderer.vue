<script lang="ts" setup>
import {computed} from 'vue'
import {answerTypeRegistry} from '../answer-types'
import MultiSelectMatrixAnswer from './answers/MultiSelectMatrixAnswer.vue'
import type {Answers, DetailAnswers, SurveyItem, SurveyOption} from '../domain/survey'

const props = defineProps<{
  item: SurveyItem;
  answers: Answers;
  detailAnswers: DetailAnswers;
  options: SurveyOption[];
  rowOptions: Record<string, SurveyOption[]>
}>()
const answer = computed({
  get: () => props.answers[props.item.id],
  set: (value) => {
    props.answers[props.item.id] = value
  },
})
const definition = computed(() => answerTypeRegistry[props.item.kind])
const component = computed(() =>
    props.item.kind === 'multiSelect' && props.item.layout === 'matrix'
        ? MultiSelectMatrixAnswer
        : definition.value?.component,
)
const componentProps = computed(() => {
  const commonProps = {item: props.item}

  if (props.item.kind === 'matrixSingleSelect') {
    return {...commonProps, rowOptions: props.rowOptions}
  }

  if (props.item.kind === 'multiSelect' && props.item.layout === 'matrix') {
    return {...commonProps, rowOptions: props.rowOptions}
  }

  if (props.item.kind === 'singleSelect' || props.item.kind === 'multiSelect') {
    return {...commonProps, options: props.options, detailAnswers: props.detailAnswers}
  }

  return commonProps
})
</script>

<template>
  <div v-if="component" class="survey-answer">
    <component
        :is="component"
        v-model:answer="answer"
        v-bind="componentProps"
    />
  </div>
  <v-alert v-else type="info" variant="tonal">
    This question type is not yet available in the respondent application.
  </v-alert>
</template>
