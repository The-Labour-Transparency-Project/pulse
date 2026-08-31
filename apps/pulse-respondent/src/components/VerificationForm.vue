<script lang="ts" setup>
defineProps<{
  email: string;
  code: string;
  requested: boolean;
  verificationError: string;
  showTitle?: boolean;
}>();

defineEmits<{
  "update:email": [value: string];
  "update:code": [value: string];
  requestCode: [];
  confirmCode: [];
}>();
</script>

<template>
  <v-card class="verification-card pa-4" variant="outlined">
    <div v-if="showTitle !== false" class="text-h6 mb-2">Verify before submitting</div>
    <p class="text-body-2 mb-4">Enter your email address to receive a verification token. Only verified
      responses can be submitted.</p>
    <v-text-field :disabled="requested" :model-value="email" autocomplete="email" label="Email address to recieve token"
                  prepend-inner-icon="mdi-email-outline" type="email"
                  @update:model-value="$emit('update:email', String($event))"/>
    <v-btn v-if="!requested" color="secondary" variant="tonal" @click="$emit('requestCode')">Send verification
      code
    </v-btn>
    <template v-else>
      <v-text-field :model-value="code" autocomplete="one-time-code" class="mt-3"
                    label="Verification token" prepend-inner-icon="mdi-shield-key-outline"
                    @update:model-value="$emit('update:code', String($event))"/>
      <div class="d-flex flex-wrap ga-3 align-center">
        <v-btn color="secondary" @click="$emit('confirmCode')">Confirm code</v-btn>
        <v-btn variant="text" @click="$emit('requestCode')">Use another email</v-btn>
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
