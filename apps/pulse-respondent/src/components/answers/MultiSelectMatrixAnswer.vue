<script setup lang="ts">
import { computed } from "vue";
import {
  multiSelectValidationError,
  updateMultiSelectAnswer,
  type MultiSelectMatrixAnswer,
  type SurveyItem,
  type SurveyOption,
} from "../../domain/survey";

const props = defineProps<{
  item: SurveyItem;
  rowOptions: Record<string, SurveyOption[]>;
  answer: MultiSelectMatrixAnswer | undefined;
}>();
const emit = defineEmits<{
  "update:answer": [value: MultiSelectMatrixAnswer];
}>();

const answerModel = computed(() => props.answer ?? {});

function selectedIds(rowId: string) {
  return answerModel.value[rowId] ?? [];
}

function toggle(rowId: string, optionId: string, selected: boolean) {
  const next = updateMultiSelectAnswer(
    selectedIds(rowId),
    optionId,
    selected,
    props.rowOptions[rowId] ?? [],
  );
  emit("update:answer", { ...answerModel.value, [rowId]: next });
}

function label(value: Record<string, string>) {
  return Object.values(value)[0] ?? "";
}
</script>

<template>
  <div class="matrix-answer" role="table" :aria-label="label(item.title)">
    <div
      v-for="(row, index) in item.rows ?? []"
      :key="row.id"
      class="matrix-answer__row"
      :class="{ 'matrix-answer__row--last': index === (item.rows?.length ?? 0) - 1 }"
      role="row"
    >
      <div class="matrix-answer__label" role="rowheader">
        {{ label(row.label) }}
      </div>
      <div class="matrix-answer__choices" role="cell">
        <div class="matrix-answer__option-group" role="group" :aria-label="label(row.label)">
          <v-checkbox
            v-for="option in rowOptions[row.id] ?? []"
            :key="option.id"
            :model-value="selectedIds(row.id).includes(option.id)"
            :label="label(option.label)"
            color="primary"
            density="compact"
            hide-details
            @update:model-value="toggle(row.id, option.id, Boolean($event))"
          />
        </div>
      </div>
      <p v-if="multiSelectValidationError(item, selectedIds(row.id))" class="text-error text-body-2 mb-2" role="alert">
        {{ multiSelectValidationError(item, selectedIds(row.id)) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.matrix-answer__row {
  display: grid;
  grid-template-columns: minmax(12rem, 1fr) minmax(0, 2.2fr);
  align-items: center;
  min-height: 6.5rem;
  column-gap: 1rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.matrix-answer__row--last {
  border-bottom: 0;
}

.matrix-answer__label {
  align-self: stretch;
  display: flex;
  align-items: center;
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.matrix-answer__choices {
  min-width: 0;
}

.matrix-answer__option-group {
  display: flex;
  flex-wrap: wrap;
  column-gap: 0.75rem;
}

.matrix-answer__option-group :deep(.v-label) {
  white-space: normal;
}

@media (max-width: 599px) {
  .matrix-answer__row {
    display: block;
    min-height: 0;
    padding-block: 0.75rem;
  }

  .matrix-answer__label {
    min-height: 2.5rem;
  }
}
</style>
