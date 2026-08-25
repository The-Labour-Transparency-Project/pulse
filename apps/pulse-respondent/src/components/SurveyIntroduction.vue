<script lang="ts" setup>
import type { SurveyIntroduction } from "../domain/navigation";

defineProps<{ introduction: SurveyIntroduction; hasProgress: boolean }>();
defineEmits<{ start: [] }>();
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
          About {{ introduction.estimatedMinutes }} minutes
        </v-chip>
        <v-chip prepend-icon="mdi-content-save-outline" variant="outlined">Saved automatically</v-chip>
      </div>

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
        <v-icon class="mr-1" icon="mdi-information-outline" size="18" />
        {{ introduction.autosave }}
      </p>
      <v-btn color="primary" min-width="190" size="large" @click="$emit('start')">
        {{ hasProgress ? "Continue survey" : "Start survey" }}
        <v-icon end icon="mdi-arrow-right" />
      </v-btn>
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
