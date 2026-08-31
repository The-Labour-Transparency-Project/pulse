<script lang="ts" setup>
import {ref} from "vue";

const props = defineProps<{ verified: boolean }>();
defineEmits<{ clear: [] }>();
const dialogOpen = ref(false);
</script>

<template>
  <div v-if="props.verified" class="d-flex justify-end">
    <v-btn color="tertiary" size="small" variant="text" @click="dialogOpen = true">
      Remove saved access
    </v-btn>
  </div>
  <v-dialog v-model="dialogOpen" max-width="520">
    <v-card>
      <v-card-title>Remove saved access from this device?</v-card-title>
      <v-card-text>
        Your draft answers will remain on this device, but the saved access token will be removed. You’ll need to use
        your email address again before submitting. If you submit again later, it may be treated as a separate
        submission. We do not encourage multiple submissions from the same person.
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn variant="text" @click="dialogOpen = false">Keep verification</v-btn>
        <v-btn color="primary" variant="flat" @click="$emit('clear'); dialogOpen = false">
          Remove saved access
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
