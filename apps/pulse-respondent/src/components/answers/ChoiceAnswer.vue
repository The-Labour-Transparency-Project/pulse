<script lang="ts" setup>
import {computed} from 'vue'
import {detailAnswerKey, type DetailAnswers, type SurveyItem, type SurveyOption} from '../../domain/survey'

type AnswerValue = string | string[] | undefined

const props = defineProps<{
  item: SurveyItem;
  options: SurveyOption[];
  detailAnswers: DetailAnswers;
  answer: AnswerValue
}>()
const emit = defineEmits<{ 'update:answer': [value: AnswerValue] }>()
const multiple = props.item.kind === 'multiSelect'
const maxSelections = computed(() => multiple ? props.item.validation?.maxSelections : undefined)
const selectedIds = computed(() => Array.isArray(props.answer) ? props.answer : typeof props.answer === 'string' ? [props.answer] : [])
const selectedCount = computed(() => selectedIds.value.length)
const answerModel = computed({
  get: () => props.answer,
  set: (value: AnswerValue) => emit('update:answer', value),
})
const toggleSelection = (optionId: string, selected: boolean | null) => {
  const next = selectedIds.value.filter((id) => id !== optionId)
  if (selected === true && !selectedIds.value.includes(optionId) && (!maxSelections.value || next.length < maxSelections.value)) {
    next.push(optionId)
  }
  emit('update:answer', next)
}
</script>

<template>
  <v-checkbox
      v-for="option in options"
      v-if="multiple"
      :key="option.id"
      :disabled="Boolean(maxSelections && selectedCount >= maxSelections && !selectedIds.includes(option.id))"
      :label="option.label['en-NZ'] ?? Object.values(option.label)[0]"
      :model-value="selectedIds.includes(option.id)"
      color="primary"
      density="compact"
      hide-details
      @click.prevent="toggleSelection(option.id, !selectedIds.includes(option.id))"
  />
  <template v-for="option in options" v-if="multiple" :key="`${option.id}-detail`">
    <v-textarea
        v-if="option.detailInput && selectedIds.includes(option.id) && option.detailInput.type === 'longText'"
        :model-value="detailAnswers[detailAnswerKey(item.id, option.id)]"
        auto-grow class="ml-8 mb-3" label="Please tell us more" rows="3" variant="outlined"
        @update:model-value="detailAnswers[detailAnswerKey(item.id, option.id)] = $event"
    />
    <v-text-field
        v-else-if="option.detailInput && selectedIds.includes(option.id)"
        :model-value="detailAnswers[detailAnswerKey(item.id, option.id)]"
        class="ml-8 mb-3" label="Please tell us more" variant="outlined"
        @update:model-value="detailAnswers[detailAnswerKey(item.id, option.id)] = $event"
    />
  </template>
  <p v-if="multiple && maxSelections" class="ui-metadata text-medium-emphasis mt-2 mb-0">
    {{ selectedCount }} of {{ maxSelections }} selected
  </p>
  <v-radio-group v-else v-model="answerModel" color="primary" density="compact" hide-details>
    <template v-for="option in options" :key="option.id">
      <v-radio :label="option.label['en-NZ'] ?? Object.values(option.label)[0]" :value="option.id" color="primary"
               density="compact"/>
      <v-textarea
          v-if="option.detailInput && selectedIds.includes(option.id) && option.detailInput.type === 'longText'"
          :model-value="detailAnswers[detailAnswerKey(item.id, option.id)]"
          auto-grow
          class="ml-8 mb-3" label="Please tell us more" rows="3" variant="outlined"
          @update:model-value="detailAnswers[detailAnswerKey(item.id, option.id)] = $event"
      />
      <v-text-field
          v-else-if="option.detailInput && selectedIds.includes(option.id)"
          :model-value="detailAnswers[detailAnswerKey(item.id, option.id)]"
          class="ml-8 mb-3" label="Please tell us more" variant="outlined"
          @update:model-value="detailAnswers[detailAnswerKey(item.id, option.id)] = $event"
      />
    </template>
  </v-radio-group>
</template>
