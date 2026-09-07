<script lang="ts" setup>
import {ref} from "vue";

const props = defineProps<{ hasAnswers: boolean; verified: boolean }>();
defineEmits<{ clear: [] }>();
const dialogOpen = ref(false);
</script>

<template>
  <div v-if="props.hasAnswers"
       class="clear-answers-action d-flex align-center justify-space-between flex-wrap ga-3"
       role="group" aria-label="Start over">
    <div>
      <div class="text-body-2 font-weight-medium">Need to start over?</div>
    </div>
    <v-btn color="error" prepend-icon="mdi-delete-sweep-outline" variant="outlined" @click="dialogOpen = true">
      Clear all my answers
    </v-btn>
  </div>
  <v-dialog v-model="dialogOpen" max-width="520" persistent>
    <v-card>
      <v-card-title>Clear all your answers?</v-card-title>
      <v-card-text>
        This will clear all your answers saved on this device.
        <template v-if="props.verified">Your verification will not be cleared, so you can use it again if you submit a
          new response.
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn variant="text" @click="dialogOpen = false">Keep my answers</v-btn>
        <v-btn color="error" variant="flat" @click="$emit('clear'); dialogOpen = false">
          Clear all my answers
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.clear-answers-action {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid rgba(var(--v-theme-error), .24);
  border-radius: 8px;
  background: rgba(var(--v-theme-error), .035);
}

.clear-answers-action :deep(.v-btn) {
  text-transform: none;
}
</style>
