<script lang="ts" setup>
import {computed} from "vue";
import {detailAnswerKey, type DetailAnswers, type SurveyItem, type SurveyOption,} from "../../domain/survey";

const props = defineProps<{
  item: SurveyItem;
  options: SurveyOption[];
  detailAnswers: DetailAnswers;
  answer: string | undefined;
}>();
const emit = defineEmits<{ "update:answer": [value: string | undefined] }>();
const answerModel = computed({
  get: () => props.answer,
  set: (value: string | undefined) => emit("update:answer", value),
});
</script>

<template>
  <fieldset
      :aria-describedby="item.answerRequired ? `${item.id}-help` : undefined"
      class="border-0 pa-0 ma-0 w-100"
  >
    <legend class="sr-only">{{ Object.values(item.title)[0] }}</legend>
    <v-radio-group
        v-model="answerModel"
        :aria-label="Object.values(item.title)[0]"
        color="primary"
        density="compact"
        hide-details
    >
      <template v-for="option in options" :key="option.id">
        <v-radio
            :label="Object.values(option.label)[0]"
            :value="option.id"
            color="primary"
            density="compact"
        />
        <v-textarea
            v-if="
            option.detailInput &&
            answer === option.id &&
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
            v-else-if="option.detailInput && answer === option.id"
            :id="`${item.id}-${option.id}-detail`"
            :model-value="detailAnswers[detailAnswerKey(item.id, option.id)]"
            class="ml-8 mb-3"
            label="Please tell us more"
            variant="outlined"
            @update:model-value="
            detailAnswers[detailAnswerKey(item.id, option.id)] = $event
          "
        />
      </template>
    </v-radio-group>
    <p
        v-if="item.answerRequired"
        :id="`${item.id}-help`"
        class="survey-instruction mb-0"
    >
      This question is required.
    </p>
  </fieldset>
</template>
