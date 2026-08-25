<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps<{ hasAnswers: boolean; verified: boolean; inline?: boolean }>();
defineEmits<{ clear: [] }>();
const dialogOpen = ref(false);
</script>

<template>
  <div v-if="props.hasAnswers" :class="['clear-answers-action', 'd-flex', 'justify-end', { 'is-inline': props.inline }]">
    <v-btn color="error" variant="text" @click="dialogOpen = true">Clear all my answers</v-btn>
  </div>
  <v-dialog v-model="dialogOpen" max-width="520">
    <v-card>
      <v-card-title>Clear all your answers?</v-card-title>
      <v-card-text>
        This will clear all your answers saved on this device.
        <template v-if="props.verified">Your verification will not be cleared, so you can use it again if you submit a new response.</template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialogOpen = false">Keep my answers</v-btn>
        <v-btn color="error" variant="flat" @click="$emit('clear'); dialogOpen = false">
          Clear all my answers
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.clear-answers-action:not(.is-inline) {
  margin-top: 16px;
}
</style>
