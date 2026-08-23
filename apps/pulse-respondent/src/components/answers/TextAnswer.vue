<script lang="ts" setup>
import { computed } from 'vue'
import type { SurveyItem } from '../../domain/survey'

const props = defineProps<{ item: SurveyItem; answer: string | undefined }>()
const emit = defineEmits<{ 'update:answer': [value: string | undefined] }>()
const answerModel = computed({
  get: () => props.answer,
  set: (value: string | undefined) => emit('update:answer', value),
})
</script>

<template>
  <v-textarea v-if="item.kind === 'longText'" v-model="answerModel" auto-grow label="Your answer" rows="4"
              variant="outlined" />
  <v-text-field v-else v-model="answerModel" label="Your answer" variant="outlined" />
</template>
