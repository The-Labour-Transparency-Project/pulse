<script lang="ts" setup>
import {computed} from 'vue'
import type {AnswerValue, SurveyItem} from '../../domain/survey'

const props = defineProps<{ item: SurveyItem; answer: AnswerValue }>()
const emit = defineEmits<{ 'update:answer': [value: number | undefined] }>()
const scale = computed(() => props.item.scale ?? {min: 0, max: 10, step: 1})
const answerModel = computed<number | undefined>({
  get: () => typeof props.answer === 'number' ? props.answer : undefined,
  set: (value) => emit('update:answer', value),
})
</script>

<template>
  <div>
    <v-slider v-model="answerModel" :aria-label="item.title['en-NZ'] ?? Object.values(item.title)[0]" :max="scale.max"
              :min="scale.min"
              :step="scale.step" class="mt-8" color="primary" thumb-color="primary"
              thumb-label="always"
              track-color="grey-lighten-2"/>
    <div class="d-flex justify-space-between ui-metadata text-medium-emphasis">
      <span>{{ scale.min }} · {{
          scale.minLabel?.['en-NZ'] ?? (scale.minLabel ? Object.values(scale.minLabel)[0] : '')
        }}</span>
      <span>{{ scale.max }} · {{
          scale.maxLabel?.['en-NZ'] ?? (scale.maxLabel ? Object.values(scale.maxLabel)[0] : '')
        }}</span>
    </div>
  </div>
</template>
