<script lang="ts" setup>
import type {SurveyIntroduction} from "../domain/navigation";
import ClearAnswersAction from "./ClearAnswersAction.vue";

const props = withDefaults(defineProps<{
  introduction: SurveyIntroduction;
  hasProgress: boolean;
  verified: boolean;
  showStartButton?: boolean;
}>(), {
  showStartButton: true,
});
defineEmits<{ start: []; clearAnswers: [] }>();
</script>

<template>
  <section class="introduction-canvas">
    <div class="introduction-card mx-auto">
      <v-chip class="ui-badge mb-3" color="primary" rounded="4" size="small" variant="tonal">
        Welcome
      </v-chip>
      <h1 class="survey-section-title mb-4">{{ introduction.title }}</h1>
      <p class="introduction-purpose mb-4">{{ introduction.purpose }}</p>
      <p class="survey-section-description mb-8">{{ introduction.description }}</p>

      <div class="introduction-meta d-flex flex-wrap ga-3 mb-8">
        <v-chip color="primary" prepend-icon="mdi-clock-outline" variant="tonal">
          {{ introduction.estimatedTime }}
        </v-chip>
        <v-chip prepend-icon="mdi-content-save-outline" variant="outlined">Saved automatically</v-chip>
      </div>

      <v-alert class="mb-4" color="primary" icon="mdi-lightbulb-on-outline" variant="tonal">
        <div class="font-weight-medium mb-1">Tips and guidance</div>
        Open Tips &amp; Guidance at any time for more context about the survey, navigation and answering questions.
      </v-alert>
      <v-alert class="mb-8" color="info" icon="mdi-monitor-dashboard" variant="tonal">
        <div class="font-weight-medium mb-1">Choose the screen that works for you</div>
        You can complete the survey on a phone, tablet or computer. A larger screen may make the matrix questions
        easier to read, but using a desktop or laptop is optional.
      </v-alert>

      <v-alert class="mb-4" color="info" icon="mdi-shield-lock-outline" variant="tonal">
        <div class="font-weight-medium mb-1">Privacy and confidentiality</div>
        {{ introduction.privacy }}
      </v-alert>
      <v-alert class="mb-8" color="info" icon="mdi-chart-box-outline" variant="tonal">
        <div class="font-weight-medium mb-1">How findings are reported</div>
        {{ introduction.reporting }}
      </v-alert>
      <v-alert class="mb-8" color="primary" icon="mdi-email-check-outline" variant="tonal">
        <div class="font-weight-medium mb-1">Before you submit</div>
        {{ introduction.verification }}
      </v-alert>

      <p class="survey-section-description mb-6">
        <v-icon class="mr-1" icon="mdi-information-outline" size="18"/>
        {{ introduction.autosave }}
      </p>
      <div v-if="props.showStartButton" class="d-flex align-center flex-wrap ga-3">
        <v-btn append-icon="mdi-arrow-right" color="primary" min-width="250" @click="$emit('start')">
          {{ hasProgress ? "Continue survey" : "Start survey" }}
        </v-btn>
      </div>
      <ClearAnswersAction :has-answers="props.hasProgress" :verified="props.verified"
                          @clear="$emit('clearAnswers')"/>
    </div>
  </section>
</template>

<style scoped>
.introduction-canvas {
  display: flex;
  min-height: 100%;
  align-items: flex-start;
  justify-content: center;
}

.introduction-card {
  width: 100%;
  margin-top: 2vh;
  padding: 20px 24px 24px;
}

.introduction-purpose {
  color: rgba(var(--v-theme-on-surface), .88);
  font-size: 18px;
  line-height: 1.5;
}

@media (max-width: 959px) {
  .introduction-card {
    padding-inline: 16px;
  }
}

</style>
