<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps<{ verified: boolean }>();
defineEmits<{ clear: [] }>();
const dialogOpen = ref(false);
</script>

<template>
  <div v-if="props.verified" class="d-flex justify-end">
    <v-btn color="tertiary" size="small" variant="text" @click="dialogOpen = true">
      Clear verification
    </v-btn>
  </div>
  <v-dialog v-model="dialogOpen" max-width="520">
    <v-card>
      <v-card-title>Clear verification?</v-card-title>
      <v-card-text>
        This removes the saved verification token from this device. You will need to verify again before submitting,
        and any later submission will be treated as a new submission. We do not encourage multiple submissions from
        the same person.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialogOpen = false">Keep verification</v-btn>
        <v-btn color="primary" variant="flat" @click="$emit('clear'); dialogOpen = false">
          Clear verification
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
