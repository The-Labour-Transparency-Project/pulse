<script lang="ts" setup>
defineProps<{ answeredCount: number; visibleCount: number; showReturnButton: boolean }>();
defineEmits<{ submit: []; returnToSurvey: [] }>();
</script>

<template>
  <section class="review-canvas">
    <div class="review-card mx-auto">
      <v-chip class="ui-badge mb-3" color="primary" rounded="4" size="small" variant="tonal">
        Review &amp; submit
      </v-chip>
      <h1 class="survey-section-title mb-4">Review your responses</h1>
      <p class="review-description mb-6">
        You can submit your response whenever you are ready. Unanswered questions are shown for awareness only and do
        not prevent submission.
      </p>
      <v-alert class="mb-4" color="info" icon="mdi-chart-donut" variant="tonal">
        <div class="font-weight-medium mb-1">Your progress</div>
        {{ answeredCount }} of {{ visibleCount }} questions answered
      </v-alert>
      <v-alert v-if="answeredCount < visibleCount" class="mb-8" color="warning" icon="mdi-alert-outline"
               variant="tonal">
        Some questions are unanswered. You may return to them, or submit now with a partial response.
      </v-alert>
      <div class="d-flex flex-wrap ga-3">
        <v-btn color="primary" @click="$emit('submit')">
          Submit response
        </v-btn>
        <v-spacer />
        <v-btn v-if="showReturnButton" variant="outlined" @click="$emit('returnToSurvey')">Return to survey</v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.review-canvas {
  display: flex;
  min-height: 100%;
  align-items: flex-start;
  justify-content: center;
}

.review-card {
  width: 100%;
  margin-top: 2vh;
  padding: 20px 24px 24px;
}

.review-description {
  color: rgba(var(--v-theme-on-surface), .88);
  font-size: 18px;
  line-height: 1.5;
}

@media (max-width: 959px) {
  .review-card {
    padding-inline: 16px;
  }
}

</style>
