<script lang="ts" setup>
import ClearAnswersAction from "./ClearAnswersAction.vue";
import VerificationForm from "./VerificationForm.vue";
import VerificationStatus from "./VerificationStatus.vue";

const props = defineProps<{
  answeredCount: number;
  visibleCount: number;
  showReturnButton: boolean;
  email: string;
  code: string;
  requested: boolean;
  requesting: boolean;
  requestMessage: string;
  verified: boolean;
  verificationError: string;
  submitting: boolean;
  submissionError: string;
}>();
defineEmits<{
  submit: [];
  returnToSurvey: [];
  clearVerification: [];
  clearAnswers: [];
  "update:email": [value: string];
  "update:code": [value: string];
  requestCode: [];
  confirmCode: [];
  useAnotherEmail: [];
}>();
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
      <div v-if="props.verified" class="review-verification-panel mb-8">
        <VerificationStatus @clear="$emit('clearVerification')"/>
      </div>
      <VerificationForm v-else :code="props.code" :email="props.email" :request-message="props.requestMessage" :requested="props.requested"
                        :requesting="props.requesting"
                        :verification-error="props.verificationError" class="mb-8"
                        @update:email="$emit('update:email', $event)" @update:code="$emit('update:code', $event)"
                        @request-code="$emit('requestCode')" @confirm-code="$emit('confirmCode')"
                        @use-another-email="$emit('useAnotherEmail')"/>
      <v-alert v-if="props.submissionError" class="mb-4" color="error" icon="mdi-cloud-alert-outline" variant="tonal">
        {{ props.submissionError }} You can try submitting again.
      </v-alert>
      <div class="d-flex flex-wrap ga-3">
        <div class="d-flex align-center ga-2">
          <v-btn :loading="props.submitting" :min-width="120" :disabled="props.submitting || !props.verified" color="primary"
                 @click="$emit('submit')">
            {{ props.submitting ? "Saving response…" : "Submit response" }}
          </v-btn>
        </div>
        <v-spacer/>
        <ClearAnswersAction :has-answers="props.answeredCount > 0" :inline="true" :verified="props.verified"
                            @clear="$emit('clearAnswers')"/>
        <v-btn v-if="showReturnButton" variant="text" @click="$emit('returnToSurvey')">Return to survey</v-btn>
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

.review-verification-panel {
  --verification-success-bg: color-mix(in srgb, rgb(var(--v-theme-success)) 8%, rgb(var(--v-theme-surface)) 92%);
  border: 1px solid rgba(var(--v-theme-success), .18);
  border-radius: 7px;
  padding: 12px 16px;
  background: var(--verification-success-bg);
}

@media (max-width: 959px) {
  .review-card {
    padding-inline: 16px;
  }
}

</style>
