<script lang="ts" setup>
import {useDisplay} from "vuetify";

defineProps<{ answeredCount: number; visibleCount: number; isDark: boolean; tipsOpen: boolean }>();
defineEmits<{ toggleTheme: []; openNavigation: []; toggleTips: [] }>();
const {xs} = useDisplay();
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
