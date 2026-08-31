<script lang="ts" setup>
import {computed} from "vue";
import {useDisplay} from "vuetify";

defineProps<{ canGoPrevious: boolean }>();
defineEmits<{ previous: []; previousUnanswered: []; nextUnanswered: []; next: [] }>();
const {xs} = useDisplay();
const compactMobile = computed(() => xs.value);
</script>

<template>
  <div class="question-navigation d-flex flex-wrap justify-space-between align-center ga-2 pa-2 mt-2">
    <v-btn :disabled="!canGoPrevious" prepend-icon="mdi-arrow-left" variant="outlined" @click="$emit('previous')">
      Previous
    </v-btn>
    <div v-if="!compactMobile" class="d-flex ga-2">
      <v-btn prepend-icon="mdi-chevron-up" variant="outlined" @click="$emit('previousUnanswered')">
        Previous unanswered
      </v-btn>
      <v-btn append-icon="mdi-chevron-down" variant="outlined" @click="$emit('nextUnanswered')">
        Next unanswered
      </v-btn>
    </div>
    <v-menu v-else location="top" scroll-strategy="close">
      <template #activator="{ props: menuProps }">
        <v-btn aria-label="Unanswered navigation" prepend-icon="mdi-format-list-bulleted" v-bind="menuProps"
               variant="outlined">
          Unanswered
        </v-btn>
      </template>
      <v-list density="compact" min-width="220">
        <v-list-item prepend-icon="mdi-chevron-up" title="Previous unanswered" @click="$emit('previousUnanswered')"/>
        <v-list-item prepend-icon="mdi-chevron-down" title="Next unanswered" @click="$emit('nextUnanswered')"/>
      </v-list>
    </v-menu>
    <v-btn append-icon="mdi-arrow-right" color="primary" @click="$emit('next')">Next</v-btn>
  </div>
</template>

<style scoped>
.question-navigation {
  flex: 0 0 auto;
}

.question-navigation :deep(.v-btn) {
  border-radius: 7px;
  text-transform: none;
}

.question-navigation :deep(.v-btn--variant-outlined) {
  border-color: rgba(var(--v-theme-primary), .24) !important;
  background: rgba(var(--v-theme-primary), .025);
  color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 1px 4px rgba(var(--v-theme-primary), .08);
}

.question-navigation :deep(.v-btn--variant-outlined:hover) {
  background: rgba(var(--v-theme-primary), .07);
  border-color: rgba(var(--v-theme-primary), .36) !important;
}

.question-navigation :deep(.v-btn--disabled) {
  border-color: rgba(var(--v-theme-primary), .14) !important;
  color: rgba(var(--v-theme-primary), .48) !important;
}

.question-navigation :deep(.v-btn--variant-elevated) {
  box-shadow: 0 2px 5px rgba(var(--v-theme-primary), .18);
}

@media (max-width: 599px) {
  .question-navigation {
    position: fixed;
    z-index: 10;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex !important;
    flex-wrap: nowrap !important;
    gap: 4px !important;
    margin: 0;
    padding: 8px 8px max(8px, env(safe-area-inset-bottom));
    border-top: 1px solid rgba(var(--v-theme-on-surface), .12);
    background: rgb(var(--v-theme-surface));
    box-shadow: 0 -2px 10px rgba(0, 0, 0, .12);
  }

  .question-navigation > .v-btn,
  .question-navigation > div,
  .question-navigation > div > .v-btn,
  .question-navigation > .v-menu {
    flex: 1 1 0;
    min-width: 0;
    width: 100%;
  }

  .question-navigation > div {
    display: contents !important;
  }

  .question-navigation > .v-menu :deep(.v-btn) {
    width: 100%;
  }

  .question-navigation :deep(.v-btn) {
    height: 44px !important;
    min-height: 44px;
    padding-inline: 6px;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 0 !important;
    line-height: 1.1;
    white-space: normal;
  }

  .question-navigation :deep(.v-btn__prepend),
  .question-navigation :deep(.v-btn__append) {
    margin-inline: 0 3px;
  }

  .question-navigation :deep(.v-btn--variant-outlined) {
    border-color: rgba(var(--v-theme-primary), .24) !important;
    background: rgba(var(--v-theme-primary), .02);
    box-shadow: 0 1px 2px rgba(var(--v-theme-primary), .06);
  }

  .question-navigation :deep(.v-btn--variant-elevated) {
    box-shadow: 0 2px 4px rgba(var(--v-theme-primary), .2);
  }
}
</style>
