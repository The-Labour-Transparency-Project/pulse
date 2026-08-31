<script lang="ts" setup>
import {computed} from 'vue'
import type {AnswerValue, MatrixAnswer, SurveyItem, SurveyOption} from '../../domain/survey'

const props = defineProps<{ item: SurveyItem; rowOptions: Record<string, SurveyOption[]>; answer: AnswerValue }>()
const emit = defineEmits<{ 'update:answer': [value: MatrixAnswer] }>()

const answerModel = computed<MatrixAnswer>(() => {
  if (!props.answer || typeof props.answer !== 'object' || Array.isArray(props.answer)) return {}
  return Object.fromEntries(
      Object.entries(props.answer).filter(([, value]) => typeof value === 'string'),
  )
})

const columnOptions = computed(() => {
  const firstRow = props.item.rows?.[0]
  return firstRow ? props.rowOptions[firstRow.id] ?? [] : []
})

function updateRow(rowId: string, value: string | null) {
  if (!value) return
  emit('update:answer', {...answerModel.value, [rowId]: value})
}
</script>

<template>
  <div :aria-label="item.title['en-NZ'] ?? Object.values(item.title)[0]" class="matrix-answer">
    <div class="matrix-answer__desktop" role="table">
      <div
          :style="{ gridTemplateColumns: `minmax(10rem, 1.35fr) repeat(${columnOptions.length}, minmax(0, 1fr))` }"
          class="matrix-answer__desktop-row matrix-answer__desktop-header"
          role="row"
      >
        <div class="matrix-answer__desktop-label" role="columnheader"/>
        <div
            v-for="option in columnOptions"
            :key="option.id"
            class="matrix-answer__desktop-cell matrix-answer__desktop-heading"
            role="columnheader"
        >
          {{ option.label['en-NZ'] ?? Object.values(option.label)[0] }}
        </div>
      </div>
      <div
          v-for="row in item.rows ?? []"
          :key="row.id"
          :style="{ gridTemplateColumns: `minmax(10rem, 1.35fr) repeat(${columnOptions.length}, minmax(0, 1fr))` }"
          class="matrix-answer__desktop-row"
          role="row"
      >
        <div class="matrix-answer__desktop-label" role="rowheader">
          {{ row.label['en-NZ'] ?? Object.values(row.label)[0] }}
        </div>
        <div v-for="option in columnOptions" :key="option.id" class="matrix-answer__desktop-cell" role="cell">
          <v-radio
              :aria-label="`${row.label['en-NZ'] ?? Object.values(row.label)[0]}: ${option.label['en-NZ'] ?? Object.values(option.label)[0]}`"
              :model-value="answerModel[row.id]"
              :value="option.id"
              color="primary"
              density="compact"
              hide-details
              @click="updateRow(row.id, option.id)"
          />
        </div>
      </div>
    </div>

    <div class="matrix-answer__mobile" role="table">
      <v-row
          v-for="(row, index) in item.rows ?? []"
          :key="row.id"
          :class="{ 'matrix-answer__row--last': index === (item.rows?.length ?? 0) - 1 }"
          class="matrix-answer__row mx-0 align-center"
          role="row"
      >
        <v-col class="matrix-answer__label text-body-2 font-weight-medium py-4" cols="12" md="4" role="rowheader">
          {{ row.label['en-NZ'] ?? Object.values(row.label)[0] }}
        </v-col>
        <v-col class="matrix-answer__choices py-2" cols="12" md="8">
          <v-radio-group
              :model-value="answerModel[row.id]"
              density="compact"
              hide-details
              inline
              role="cell"
              @update:model-value="updateRow(row.id, $event)"
          >
            <v-radio v-for="option in rowOptions[row.id] ?? []" :key="option.id"
                     :label="option.label['en-NZ'] ?? Object.values(option.label)[0]"
                     :value="option.id" color="primary"
                     density="compact"/>
          </v-radio-group>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped>
.matrix-answer__desktop {
  display: block;
  width: 100%;
}

.matrix-answer__desktop-row {
  display: grid;
  min-width: 0;
}

.matrix-answer__desktop-row > * {
  min-width: 0;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.matrix-answer__desktop-row > *:last-child {
  border-right: 0;
}

.matrix-answer__desktop-row:first-child > * {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.matrix-answer__desktop-label,
.matrix-answer__desktop-cell {
  min-height: 2.75rem;
  padding: 0.45rem 0.6rem;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.matrix-answer__desktop-cell {
  justify-content: center;
  text-align: center;
}

.matrix-answer__desktop-cell :deep(.v-selection-control) {
  flex: 0 0 auto;
  justify-content: center;
  min-height: 0;
}

.matrix-answer__desktop-heading {
  font-weight: 600;
  font-size: 13px;
}

.matrix-answer__mobile {
  display: none;
}

.matrix-answer__row {
  min-height: 6.5rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.matrix-answer__row--last {
  border-bottom: 0;
}

.matrix-answer__label {
  align-self: stretch;
  display: flex;
  align-items: center;
}

.matrix-answer__choices {
  display: flex;
  align-items: center;
}

.matrix-answer__choices :deep(.v-selection-control-group--inline) {
  column-gap: 0.75rem;
  row-gap: 0;
}

.matrix-answer__choices :deep(.v-label) {
  white-space: normal;
}

@media (max-width: 599px) {
  .matrix-answer__desktop {
    display: none;
  }

  .matrix-answer__mobile {
    display: block;
  }

  .matrix-answer__row {
    min-height: 0;
    padding-block: 0.75rem;
  }

  .matrix-answer__label {
    min-height: 2.5rem;
    padding-block: 0 !important;
  }

  .matrix-answer__choices {
    padding-block: 0 !important;
  }
}
</style>
