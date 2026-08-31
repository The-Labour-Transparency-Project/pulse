<script lang="ts" setup>
import {computed} from "vue";
import {
  detailAnswerKey,
  type DetailAnswers,
  multiSelectValidationError,
  type SurveyItem,
  type SurveyOption,
  updateMultiSelectAnswer,
} from "../../domain/survey";

const props = defineProps<{
  item: SurveyItem;
  options: SurveyOption[];
  detailAnswers: DetailAnswers;
  answer: string[] | undefined;
}>();
const emit = defineEmits<{ "update:answer": [value: string[]] }>();
const selectedIds = computed(() => props.answer ?? []);
const minSelections = computed(() => props.item.validation?.minSelections ?? 0);
const maxSelections = computed(() => props.item.validation?.maxSelections);
const errorMessage = computed(() =>
    multiSelectValidationError(props.item, selectedIds.value),
);
const hasError = computed(() => Boolean(errorMessage.value));

function toggle(optionId: string, selected: boolean) {
  if (
      selected &&
      maxSelections.value &&
      selectedIds.value.length >= maxSelections.value
  )
    return;
  emit(
      "update:answer",
      updateMultiSelectAnswer(
          selectedIds.value,
          optionId,
          selected,
          props.options,
      ),
  );
}
</script>

<template>
  <fieldset
      :aria-describedby="`${item.id}-help ${item.id}-error`"
      :aria-invalid="hasError"
      class="border-0 pa-0 ma-0 w-100"
  >
    <legend class="sr-only">{{ Object.values(item.title)[0] }}</legend>
    <div :aria-label="Object.values(item.title)[0]" role="group">
      <div v-for="option in options" :key="option.id" class="survey-choice-row">
        <v-checkbox
            :aria-describedby="
            option.detailInput ? `${item.id}-${option.id}-detail` : undefined
          "
            :disabled="
            Boolean(
              maxSelections &&
              selectedIds.length >= maxSelections &&
              !selectedIds.includes(option.id),
            )
          "
            :label="Object.values(option.label)[0]"
            :model-value="selectedIds.includes(option.id)"
            color="primary"
            density="compact"
            hide-details
            @update:model-value="toggle(option.id, Boolean($event))"
        />
        <v-textarea
            v-if="
            option.detailInput &&
            selectedIds.includes(option.id) &&
            option.detailInput.type === 'longText'
          "
            :id="`${item.id}-${option.id}-detail`"
            :model-value="detailAnswers[detailAnswerKey(item.id, option.id)]"
            auto-grow
            class="ml-8 mb-3"
            label="Please tell us more"
            rows="3"
            variant="outlined"
            @update:model-value="
            detailAnswers[detailAnswerKey(item.id, option.id)] = $event
          "
        />
        <v-text-field
            v-else-if="option.detailInput && selectedIds.includes(option.id)"
            :id="`${item.id}-${option.id}-detail`"
            :model-value="detailAnswers[detailAnswerKey(item.id, option.id)]"
            class="ml-8 mb-3"
            label="Please tell us more"
            variant="outlined"
            @update:model-value="
            detailAnswers[detailAnswerKey(item.id, option.id)] = $event
          "
        />
      </div>
    </div>
    <p
        :id="`${item.id}-help`"
        class="ui-metadata text-medium-emphasis mt-2 mb-0"
    >
      {{
        maxSelections
            ? `${selectedIds.length} of ${maxSelections} selected`
            : `${selectedIds.length} selected`
      }}
    </p>
    <p
        v-if="hasError"
        :id="`${item.id}-error`"
        class="text-error text-body-2 mt-1 mb-0"
        role="alert"
    >
      {{ errorMessage }}
    </p>
  </fieldset>
</template>
