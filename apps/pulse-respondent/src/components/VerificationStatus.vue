<script lang="ts" setup>
import ClearVerificationAction from "./ClearVerificationAction.vue";

withDefaults(defineProps<{
  message?: string;
}>(), {
  message: "Ready to submit responses",
});

defineEmits<{ clear: [] }>();
</script>

<template>
  <div class="verification-status" role="status">
    <div class="verification-content d-flex align-center ga-2">
      <v-chip color="success" prepend-icon="mdi-shield-check-outline" size="small" variant="outlined">
        Access confirmed
      </v-chip>
      <div class="verification-message">{{ message }}</div>
      <ClearVerificationAction :verified="true" @clear="$emit('clear')"/>
    </div>
  </div>
</template>

<style scoped>
.verification-status {
  font-size: 13px;
  line-height: 1.45;
}

.verification-content {
  min-width: 0;
}

.verification-message {
  min-width: 0;
  flex: 1 1 auto;
}

.verification-content :deep(.v-btn) {
  white-space: nowrap;
}
</style>
