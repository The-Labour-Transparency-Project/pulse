<script lang="ts" setup>
import {nextTick, ref} from "vue";

const emailInput = ref<{ $el?: HTMLElement } | null>(null);

defineProps<{
  email: string;
  code: string;
  requested: boolean;
  requesting: boolean;
  verificationError: string;
  showTitle?: boolean;
}>();

const emit = defineEmits<{
  "update:email": [value: string];
  "update:code": [value: string];
  requestCode: [];
  confirmCode: [];
  useAnotherEmail: [];
}>();

async function useAnotherEmail() {
  // The parent clears the controlled values; focus after that render re-enables
  // the email field.
  emit("useAnotherEmail");
  await nextTick();
  emailInput.value?.$el?.querySelector<HTMLInputElement>("input")?.focus();
}
</script>

<template>
  <v-card class="verification-card pa-4" variant="outlined">
    <div v-if="showTitle !== false" class="text-h6 mb-2">Verify before submitting</div>
    <p class="text-body-2 mb-4">Enter your email address and we’ll send you a secure access link. You’ll need this link
      before submitting your response. Access links expire after 7 days; you can request a new link if needed.</p>
    <v-text-field ref="emailInput" :disabled="requested || requesting" :model-value="email" autocomplete="email" label="Email address"
                  prepend-inner-icon="mdi-email-outline" type="email"
                  @update:model-value="$emit('update:email', String($event))"/>
    <v-btn v-if="!requested" :disabled="requesting" :loading="requesting" color="secondary" variant="tonal"
           @click="$emit('requestCode')">Send verification
      code
    </v-btn>
    <template v-else>
      <v-text-field :model-value="code" autocomplete="one-time-code" class="mt-3"
                    label="Access token" prepend-inner-icon="mdi-shield-key-outline"
                    @update:model-value="$emit('update:code', String($event))"/>
      <div class="d-flex flex-wrap ga-3 align-center">
        <v-btn color="secondary" @click="$emit('confirmCode')">Confirm code</v-btn>
        <v-btn variant="text" @click="useAnotherEmail">Use another email</v-btn>
      </div>
    </template>
    <v-alert v-if="verificationError" class="mt-4" color="error" density="compact" variant="tonal">
      {{ verificationError }}
    </v-alert>
  </v-card>
</template>

<style scoped>
.verification-card {
  border-color: rgba(var(--v-theme-on-surface), .75);
}
</style>
