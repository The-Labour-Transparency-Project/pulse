<script lang="ts" setup>
import type { SurveyOutro } from "../domain/navigation";
import ClearAnswersAction from "./ClearAnswersAction.vue";
import ClearVerificationAction from "./ClearVerificationAction.vue";

const props = defineProps<{ outro: SurveyOutro; answeredCount: number; visibleCount: number; submitted: boolean; showReturnButton: boolean; verified: boolean }>();
defineEmits<{ returnToSurvey: []; clearAnswers: []; clearVerification: [] }>();
</script>

<template>
  <section class="outro-canvas">
    <div class="outro-card mx-auto">
      <v-chip class="ui-badge mb-3" color="primary" rounded="4" size="small" variant="tonal">
        Outro
      </v-chip>
      <div class="ui-metadata text-primary mb-3">{{ submitted ? "Response submitted" : "Survey outro" }}</div>
      <h1 class="survey-section-title mb-4">{{ outro.title }}</h1>
      <p class="outro-description mb-6">{{ outro.description }}</p>

      <v-alert class="mb-4" :color="submitted ? 'success' : 'info'"
               :icon="submitted ? 'mdi-check-circle-outline' : 'mdi-content-save-outline'" variant="tonal">
        <div class="font-weight-medium mb-1">{{ submitted ? "Thank you" : "Your progress is saved" }}</div>
        <template v-if="submitted">
          <p class="mb-3">Your response has been submitted and saved with the survey version shown above.</p>
          <p class="mb-0">{{ outro.submissionMessage }}</p>
        </template>
        <template v-else>{{ outro.completionMessage }}</template>
      </v-alert>
      <v-alert class="mb-8" color="primary" icon="mdi-clipboard-check-outline" variant="tonal">
        <div class="font-weight-medium mb-1">What happens next</div>
        {{ outro.nextStep }}
      </v-alert>

      <div class="d-flex align-center flex-wrap ga-4">
        <v-chip color="primary" prepend-icon="mdi-chart-donut" variant="tonal">
          {{ answeredCount }} of {{ visibleCount }} questions answered
        </v-chip>
        <v-spacer />
        <ClearAnswersAction :has-answers="props.answeredCount > 0" :inline="true" :verified="props.verified"
                            @clear="$emit('clearAnswers')" />
        <ClearVerificationAction :verified="props.verified" @clear="$emit('clearVerification')" />
        <v-btn v-if="showReturnButton" color="primary" variant="text" @click="$emit('returnToSurvey')">
          Return to survey
          <v-icon end icon="mdi-arrow-left" />
        </v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.outro-canvas {
  display: flex;
  min-height: 100%;
  align-items: flex-start;
  justify-content: center;
}

.outro-card {
  width: 100%;
  margin-top: 2vh;
  padding: 20px 24px 24px;
}

.outro-description {
  color: rgba(var(--v-theme-on-surface), .88);
  font-size: 18px;
  line-height: 1.5;
}

@media (max-width: 959px) {
  .outro-card {
    padding-inline: 16px;
  }
}

</style>
