<script lang="ts" setup>
import {computed} from "vue";
import {useDisplay} from "vuetify";

const props = defineProps<{
  answeredCount: number;
  visibleCount: number;
  isDark: boolean;
  tipsOpen: boolean;
  verificationVerified: boolean;
  submitted: boolean;
}>();
const emit = defineEmits<{ toggleTheme: []; openNavigation: []; toggleTips: []; selectReview: [] }>();
const {xs} = useDisplay();
const canOpenReview = computed(() => !props.verificationVerified && !props.submitted);
const accessStatus = computed(() => props.verificationVerified
  ? {
      color: "success",
      icon: "mdi-shield-check-outline",
      label: "Access confirmed",
      message: "Access confirmed. You can submit your response while the survey is open.",
    }
  : {
      color: "grey-darken-1",
      icon: "mdi-shield-outline",
      label: "Access not confirmed",
      message: "Access not yet confirmed. You can answer the survey, but you’ll need to confirm access using the link sent to your email before submitting. Your email address is not recorded with your survey response. See Review & submit for more information.",
    });
</script>

<template>
  <v-app-bar :height="xs ? 120 : 80" border="b" class="navigation-surface px-3 px-md-5" flat>
    <v-avatar class="mr-3" color="primary" size="38" variant="tonal">
      <v-img alt="Labour Transparency Pulse" cover src="/favicon.svg"/>
    </v-avatar>
    <div class="header-copy mr-8">
      <div class="app-name">Labour Transparency Pulse</div>
      <div class="app-subtitle text-medium-emphasis">Confidence in Labour Supply Chains 2026</div>
    </div>
    <div class="progress-header mx-auto">
      <div class="d-flex justify-space-between ui-metadata mb-1"><span>Overall progress</span><span>{{ answeredCount }} of {{
          visibleCount
        }} answered</span></div>
      <div class="d-flex align-center ga-2">
        <v-progress-linear :model-value="visibleCount ? answeredCount / visibleCount * 100 : 0"
                           aria-label="Overall progress"
                           class="progress-bar flex-grow-1" color="primary" height="8" rounded/>
        <span class="ui-metadata text-medium-emphasis progress-percentage">
        {{ visibleCount ? Math.round(answeredCount / visibleCount * 100) : 0 }}%
        </span>
      </div>
    </div>
    <v-spacer/>
    <div class="header-actions d-flex align-center ga-1">
      <v-tooltip content-class="access-status-tooltip" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-icon v-bind="tooltipProps" :aria-label="accessStatus.label" :color="accessStatus.color"
                  :icon="accessStatus.icon" :role="canOpenReview ? 'button' : 'img'" class="access-status-icon"
                  :tabindex="canOpenReview ? 0 : undefined" size="20"
                  @click="canOpenReview && emit('selectReview')"
                  @keydown.enter="canOpenReview && emit('selectReview')"
                  @keydown.space.prevent="canOpenReview && emit('selectReview')"/>
        </template>
        <span>{{ accessStatus.message }}</span>
      </v-tooltip>
      <v-btn :aria-pressed="tipsOpen" :class="['tips-toggle', { 'tips-toggle--active': tipsOpen }]"
             aria-label="Toggle Tips and Guidance"
             prepend-icon="mdi-lightbulb-on-outline" variant="text" @click="$emit('toggleTips')">
        <span class="d-none d-lg-inline">Tips &amp; Guidance</span>
      </v-btn>
      <v-btn aria-label="Toggle colour theme" icon="mdi-theme-light-dark" variant="text" @click="$emit('toggleTheme')"/>
      <v-btn aria-label="Open navigation" class="d-lg-none" icon="mdi-menu" variant="text"
             @click="$emit('openNavigation')"/>
    </div>
  </v-app-bar>
</template>

<style scoped>
.progress-header {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(520px, 38vw);
  transform: translate(-50%, -50%);
}

.header-copy {
  min-width: 0;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
}

.app-subtitle {
  font-size: 14px;
  line-height: 1.35;
}

.v-app-bar {
  border-bottom-color: var(--pulse-navigation-border) !important;
}

.tips-toggle--active {
  color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), .10);
}

:global(.access-status-tooltip) {
  max-width: 360px !important;
  white-space: normal;
  line-height: 1.4;
}

@media (max-width: 599px) {
  .v-app-bar :deep(.v-toolbar__content) {
    align-items: flex-start;
    padding-top: 14px;
  }

  .header-copy {
    margin-right: 0 !important;
  }

  .app-name,
  .app-subtitle {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-name {
    font-size: 15px;
  }

  .app-subtitle {
    font-size: 12px;
  }

  .progress-header {
    position: absolute;
    top: 62px;
    left: 58px;
    width: calc(100% - 116px);
    transform: none;
  }

  .progress-header .ui-metadata {
    font-size: 11px;
  }

  .progress-header .progress-bar {
    height: 6px !important;
  }

  .tips-toggle {
    min-width: 40px !important;
    width: 40px;
    padding-inline: 0 !important;
  }

  .tips-toggle :deep(.v-btn__prepend) {
    margin-inline: 0;
  }
}

@media (min-width: 600px) and (max-width: 1279px) {
  .header-copy {
    max-width: 250px;
  }

  .progress-header {
    position: static;
    width: min(220px, 28vw);
    margin: 0 8px 0 auto;
    transform: none;
  }

  .tips-toggle {
    min-width: 40px !important;
    width: 40px;
    padding-inline: 0 !important;
  }

  .tips-toggle :deep(.v-btn__prepend) {
    margin-inline: 0;
  }
}
</style>
