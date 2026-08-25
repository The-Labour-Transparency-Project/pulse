<script lang="ts" setup>
import { guidanceItems, type GuidanceKind } from "../../domain/navigation";

const iconFor: Record<GuidanceKind, string> = {
  tip: "mdi-lightbulb-on-outline",
  info: "mdi-information-outline",
  warning: "mdi-shield-alert-outline",
  error: "mdi-alert-circle-outline",
};
const colorFor: Record<GuidanceKind, string> = {
  tip: "primary",
  info: "info",
  warning: "warning",
  error: "error",
};
</script>

<template>
  <aside class="tips-rail navigation-surface d-none d-lg-flex flex-column">
    <div class="tips-heading d-flex align-center justify-space-between pa-4">
      <span>Tips &amp; Guidance</span>
      <v-icon color="primary" icon="mdi-lightbulb-on-outline" size="20" />
    </div>
    <v-divider />
    <div class="tips-list pa-4">
      <v-alert v-for="item in guidanceItems" :key="item.id" :color="colorFor[item.kind]" :icon="iconFor[item.kind]"
               class="guidance-item mb-3" variant="flat">
        <div class="font-weight-medium mb-1">{{ item.title }}</div>
        <div>{{ item.body }}</div>
      </v-alert>
    </div>
  </aside>
</template>

<style scoped>
.tips-rail {
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid var(--pulse-navigation-border);
}

.tips-heading {
  flex: 0 0 auto;
  color: rgba(var(--v-theme-on-surface), .92);
  font-size: 14px;
  font-weight: 600;
}

.tips-list {
  min-height: 0;
  overflow-y: auto;
}

.guidance-item {
  font-size: 13px;
  line-height: 1.45;
}
</style>
