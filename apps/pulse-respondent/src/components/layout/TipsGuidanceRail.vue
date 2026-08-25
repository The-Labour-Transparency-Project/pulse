<script lang="ts" setup>
import { guidanceItems, type GuidanceKind } from "../../domain/navigation";
import VerificationForm from "../VerificationForm.vue";
import VerificationStatus from "../VerificationStatus.vue";

const props = defineProps<{
  verificationEmail: string;
  verificationCode: string;
  verificationRequested: boolean;
  verificationVerified: boolean;
  verificationError: string;
}>();

defineEmits<{
  "update:email": [value: string];
  "update:code": [value: string];
  requestCode: [];
  confirmCode: [];
  clearVerification: [];
}>();

const iconFor: Record<GuidanceKind, string> = {
  tip: "mdi-lightbulb-on-outline",
  info: "mdi-information-outline",
  warning: "mdi-shield-alert-outline",
  error: "mdi-alert-circle-outline",
};
const visibleItems = guidanceItems.filter((item) => item.id !== "required");
</script>

<template>
  <aside class="tips-rail navigation-surface d-flex flex-column pa-3">
    <section class="rail-section tips-card">
      <div class="tips-heading d-flex align-center justify-space-between px-3 py-2">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary" icon="mdi-lightbulb-on-outline" size="16" />
          <span>Tips and guidance</span>
        </div>
      </div>
      <v-divider />
      <div class="tips-list px-3 py-2">
        <div v-for="item in visibleItems" :key="item.id" class="guidance-item d-flex ga-2 py-2">
          <v-icon :icon="iconFor[item.kind]" class="guidance-icon flex-shrink-0 mt-1" color="primary" size="14" />
          <div class="guidance-copy">
            <div class="guidance-title">{{ item.title }}</div>
            <div class="guidance-body">{{ item.body }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="rail-section verification-section mt-3 pa-3"
             :class="{ 'verification-section--verified': props.verificationVerified }">
      <div class="section-heading mb-2">Before you submit</div>
      <VerificationStatus v-if="props.verificationVerified" @clear="$emit('clearVerification')" />
      <VerificationForm v-else :code="props.verificationCode" :email="props.verificationEmail"
                        :requested="props.verificationRequested" :show-title="false"
                        :verification-error="props.verificationError"
                        @update:email="$emit('update:email', $event)" @update:code="$emit('update:code', $event)"
                        @request-code="$emit('requestCode')" @confirm-code="$emit('confirmCode')" />
    </section>
  </aside>
</template>

<style scoped>
.tips-rail {
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid var(--pulse-navigation-border);
}

.rail-section {
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-primary), .14);
  border-radius: 7px;
  background: var(--pulse-tip-bg);
  box-shadow: 0 1px 3px rgba(31, 78, 121, .06);
}

.tips-card {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.tips-heading {
  flex: 0 0 auto;
  color: rgba(var(--v-theme-on-surface), .92);
  font-size: 14px;
  font-weight: 600;
}

.tips-heading :deep(.v-badge__badge) {
  position: static;
  transform: none;
  font-size: 9px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
}

.tips-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.guidance-item {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .06);
}

.guidance-item:last-of-type {
  border-bottom: 0;
}

.guidance-icon {
  opacity: .82;
}

.guidance-copy {
  min-width: 0;
}

.guidance-title,
.guidance-body {
  font-size: 13px;
  line-height: 1.35;
}

.guidance-title {
  color: rgba(var(--v-theme-on-surface), .9);
  font-weight: 600;
}

.guidance-body {
  color: rgba(var(--v-theme-on-surface), .58);
}

.verification-section {
  border-top: 1px solid rgba(var(--v-theme-on-surface), .08);
}

.verification-section--verified {
  --verification-success-bg: color-mix(in srgb, rgb(var(--v-theme-success)) 8%, rgb(var(--v-theme-surface)) 92%);
  border-color: rgba(var(--v-theme-success), .18);
  background: var(--verification-success-bg);
}

.verification-section :deep(.verification-card) {
  box-shadow: none;
}

.verification-section--verified :deep(.verification-status) {
  background: inherit !important;
}

.verification-section :deep(.text-h6) {
  font-size: 16px !important;
}

.section-heading {
  color: rgba(var(--v-theme-on-surface), .92);
  font-size: 14px;
  font-weight: 600;
}

</style>
