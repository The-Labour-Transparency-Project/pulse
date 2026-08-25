<script lang="ts" setup>
import { type Answers, localized, type SurveyDefinition } from "../../domain/survey";
import type { ViewMode } from "../../composables/useSurveyExperience";
import type { SurveyDestination } from "../../domain/navigation";

defineProps<{
  survey: SurveyDefinition;
  answers: Answers;
  sectionIndex: number;
  destination: SurveyDestination;
  submitted: boolean;
  viewMode: ViewMode;
  sectionAnswered: (id: string) => number;
  sectionVisibleCount: (id: string) => number
}>();
defineEmits<{
  selectSection: [index: number];
  selectIntroduction: [];
  selectReview: [];
  selectOutro: [];
  updateView: [mode: ViewMode]
}>();
</script>

<template>
  <aside class="section-rail navigation-surface d-none d-lg-flex flex-column pa-4">
    <div class="ui-metadata text-medium-emphasis mb-2">View</div>
    <v-btn-toggle
        :model-value="viewMode"
        class="view-toggle mb-6"
        color="primary"
        divided
        mandatory
        @update:model-value="$emit('updateView', $event)"
    >
      <v-btn prepend-icon="mdi-format-list-bulleted" size="small" stacked value="continuous">Continuous</v-btn>
      <v-btn prepend-icon="mdi-view-grid-outline" size="small" stacked value="sections">Sections</v-btn>
      <v-btn prepend-icon="mdi-card-text-outline" size="small" stacked value="question">One by one</v-btn>
    </v-btn-toggle>
    <div class="section-heading d-flex justify-space-between align-center mb-3">
      <span>Survey sections</span>
      <span class="ui-metadata text-medium-emphasis">{{ survey.sections.length }} sections</span>
    </div>
    <v-divider class="mb-2" />
    <v-list class="section-list bg-transparent pa-0">
      <v-list-item :active="destination.type === 'introduction'"
                   class="section-item survey-destination-item destination-introduction-item" rounded="lg"
                   @click="$emit('selectIntroduction')">
        <v-list-item-title class="section-nav-title text-wrap">Introduction</v-list-item-title>
        <v-list-item-subtitle class="destination-subtitle">About this survey</v-list-item-subtitle>
      </v-list-item>
      <v-list-item v-for="(section, index) in survey.sections" :key="section.id"
                   :active="destination.type === 'question' && index === sectionIndex"
                   class="section-item" rounded="lg" @click="$emit('selectSection', index)">
        <div class="section-label">
          <span class="section-number">{{ index + 1 }}</span>
          <v-list-item-title class="section-nav-title text-wrap">{{
              localized(section.title, survey.defaultLocale)
            }}
          </v-list-item-title>
        </div>
        <template #append><span class="ui-metadata text-medium-emphasis mr-2">{{
            sectionAnswered(section.id)
          }} / {{ sectionVisibleCount(section.id) }}</span>
          <v-progress-circular
              :model-value="sectionVisibleCount(section.id) ? sectionAnswered(section.id) / sectionVisibleCount(section.id) * 100 : 0"
              color="primary" size="20" width="3" />
        </template>
      </v-list-item>
      <v-list-item v-if="!submitted" :active="destination.type === 'review'"
                   class="section-item survey-destination-item" rounded="lg"
                   @click="$emit('selectReview')">
        <v-list-item-title class="section-nav-title text-wrap">Review &amp; submit</v-list-item-title>
        <v-list-item-subtitle class="destination-subtitle">Thank you</v-list-item-subtitle>
      </v-list-item>
      <v-list-item v-if="submitted" :active="destination.type === 'outro'"
                   class="section-item survey-destination-item" rounded="lg"
                   @click="$emit('selectOutro')">
        <v-list-item-title class="section-nav-title text-wrap">Outro</v-list-item-title>
        <v-list-item-subtitle class="destination-subtitle">Thank you</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </aside>
</template>

<style scoped>
.section-rail {
  border-right: 1px solid var(--pulse-navigation-border);
  background: var(--pulse-navigation-bg);
  min-height: 0;
  overflow: hidden;
}

.view-toggle {
  width: 100%;
  height: 64px;
  gap: 0;
  background: transparent;
  overflow: visible;
}

.view-toggle :deep(.v-btn) {
  flex: 1;
  min-width: 0;
  min-height: 56px;
  margin: 0;
  padding: 6px 8px;
  border: 1px solid transparent !important;
  border-radius: 8px !important;
  color: rgba(var(--v-theme-on-surface), .8);
  background: var(--pulse-navigation-bg) !important;
  font-size: 13px;
  letter-spacing: 0;
  text-transform: none;
}

.view-toggle :deep(.v-btn + .v-btn) {
  border-left: 1px solid var(--pulse-navigation-border) !important;
  border-radius: 8px !important;
}

.view-toggle :deep(.v-btn--active + .v-btn) {
  border-left-color: transparent !important;
}

.view-toggle :deep(.v-btn--active) {
  z-index: 1;
  border: 1px solid rgba(var(--v-theme-primary), .26) !important;
  border-radius: 8px !important;
  background: rgba(var(--v-theme-primary), .08) !important;
  color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), .08);
}

.view-toggle :deep(.v-btn--active .v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
}

.section-heading {
  font-size: 14px;
  font-weight: 600;
}

.section-number {
  flex: 0 0 32px;
  width: 32px;
  color: rgba(var(--v-theme-on-surface), .78);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
}

.section-item {
  min-height: 76px;
  margin-bottom: 8px;
  padding: 12px 16px 12px 8px;
  color: rgba(var(--v-theme-on-surface), .8);
}

.survey-destination-item {
  min-height: 52px;
  padding-block: 8px;
}

.section-item :deep(.v-list-item__content) {
  padding: 0 8px;
}

.section-label {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  width: 100%;
}

.section-item :deep(.v-list-item-title) {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
}

.section-item :deep(.destination-subtitle) {
  font-size: 11px;
  line-height: 1.25;
}

.section-item :deep(.v-list-item__append) {
  align-self: center;
  gap: 8px;
  padding-inline-start: 12px;
}

.section-item :deep(.v-list-item__overlay) {
  background: transparent;
}

.section-item.v-list-item--active {
  background: rgba(var(--v-theme-primary), .09);
  color: rgba(var(--v-theme-on-surface), .98);
  border-inline-start: 0 !important;
  box-shadow: none !important;
}

.section-item.v-list-item--active::before {
  display: none;
}

.destination-introduction-item.v-list-item--active {
  border-inline-start: 3px solid rgb(var(--v-theme-primary)) !important;
}

.section-item.v-list-item--active .section-number {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.section-item.v-list-item--active :deep(.v-list-item-title) {
  font-weight: 700;
}

.section-list {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.autosave-notice {
  flex: 0 0 auto;
  margin-top: 16px;
  background: var(--pulse-autosave-bg) !important;
  border-color: rgba(var(--v-theme-on-surface), .12) !important;
  border-radius: 10px !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.autosave-notice :deep(.v-alert__content) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.autosave-notice :deep(.v-alert__prepend),
.autosave-notice :deep(.v-alert__close) {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
