<script lang="ts" setup>
import { computed, nextTick, ref, watch, type ComponentPublicInstance } from "vue";
import {
  answerProgress,
  answerStatus,
  isItemAnswered,
  matchesQuestionNavigatorFilter,
  isSelectedOptionsDependent,
  localized,
  type Answers,
  type QuestionNavigatorFilter,
  type SurveyDefinition,
  type SurveyItem
} from "../../domain/survey";

const props = defineProps<{
  survey: SurveyDefinition;
  answers: Answers;
  itemsById: Map<string, SurveyItem>;
  visibleItems: SurveyItem[];
  currentQuestionId?: string;
  visitedQuestionIds: ReadonlySet<string>;
}>();
defineEmits<{ selectQuestion: [section: number, item: number] }>();
const navigatorHidden = defineModel<boolean>("hidden", { default: false });

const questionElements = ref(new Map<string, HTMLElement>());
const navigatorFilter = ref<QuestionNavigatorFilter>("All questions");

function setQuestionElement(id: string, element: Element | ComponentPublicInstance | null) {
  const component = element as ComponentPublicInstance | null;
  const node = element instanceof HTMLElement
      ? element
      : component?.$el instanceof HTMLElement
          ? component.$el
          : null;
  if (node) {
    questionElements.value.set(id, node);
  } else {
    questionElements.value.delete(id);
  }
}

async function bringCurrentQuestionIntoView(id?: string) {
  await nextTick();
  if (!id) return;
  questionElements.value.get(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

watch(() => props.currentQuestionId, bringCurrentQuestionIntoView, { immediate: true });

const currentSectionIndex = computed(() => props.survey.sections.findIndex((section) =>
    section.itemIds.includes(props.currentQuestionId ?? ""),
));

function progressFor(id: string) {
  const item = props.itemsById.get(id);
  return item ? answerProgress(item, props.answers[id]) : { completed: 0, total: 1, complete: false };
}

function statusFor(id: string) {
  const item = props.itemsById.get(id);
  return item ? answerStatus(item, props.answers[id], props.visitedQuestionIds.has(id)) : "notVisited";
}

function sectionProgress(section: SurveyDefinition["sections"][number]) {
  const visibleIds = section.itemIds.filter((id) => props.visibleItems.some((item) => item.id === id));
  const answered = visibleIds.filter((id) => {
    const item = props.itemsById.get(id);
    return item ? isItemAnswered(item, props.answers[id]) : false;
  }).length;
  return visibleIds.length ? answered / visibleIds.length * 100 : 0;
}

function isUnavailable(id: string) {
  const item = props.itemsById.get(id);
  return !!item && isSelectedOptionsDependent(item) && !props.visibleItems.some((candidate) => candidate.id === id);
}

function isNavigatorItem(id: string) {
  if (isUnavailable(id)) {
    return navigatorFilter.value === "All questions";
  }
  const item = props.itemsById.get(id);
  return !!item && props.visibleItems.some((candidate) => candidate.id === id)
      && matchesQuestionNavigatorFilter(item, props.answers[id], navigatorFilter.value);
}
</script>

<template>
  <aside :class="['question-rail navigation-surface d-none d-lg-flex flex-column', { 'question-rail--hidden': navigatorHidden }]">
    <div :class="['navigator-heading d-flex justify-space-between align-center', navigatorHidden ? 'question-rail-hidden-heading' : 'pa-4 mb-4']">
      <span>Question navigator</span>
      <v-btn
          :aria-expanded="(!navigatorHidden).toString()"
          class="hide-button"
          size="small"
          variant="text"
          @click="navigatorHidden = !navigatorHidden"
      >
        {{ navigatorHidden ? "Show" : "Hide" }}
      </v-btn>
    </div>

    <template v-if="!navigatorHidden">
      <div class="navigator-content d-flex flex-column px-4 pb-4">
      <v-select
          v-model="navigatorFilter"
          :items="['All questions', 'Unanswered only']"
          class="navigator-filter mb-4"
          density="comfortable"
          hide-details
          label="Show"
          variant="outlined"
      />

      <v-list class="question-list bg-transparent pa-0" density="comfortable">
        <template v-for="(section, sIndex) in survey.sections" :key="section.id">
          <v-list-subheader
              :class="['navigator-section', { 'section-nav-heading--active': currentSectionIndex === sIndex }]"
          >
            <span class="section-nav-number">{{ sIndex + 1 }}</span>
            <span>{{ localized(section.title, survey.defaultLocale) }}</span>
            <v-progress-circular
                :aria-label="`${Math.round(sectionProgress(section))}% complete`"
                :model-value="sectionProgress(section)"
                color="primary"
                size="18"
                width="3"
            />
          </v-list-subheader>

          <v-list-item
              v-for="(id, qIndex) in section.itemIds"
              v-show="isNavigatorItem(id)"
              :key="id"
              :ref="(element) => setQuestionElement(id, element)"
              :active="currentQuestionId === id"
              :aria-disabled="isUnavailable(id) ? 'true' : undefined"
              :class="['question-nav-item', { 'question-nav-item--unavailable': isUnavailable(id) }]"
              rounded="lg"
              @click="!isUnavailable(id) && $emit('selectQuestion', sIndex, qIndex)"
          >
            <template #prepend>
              <span class="question-number">{{ sIndex + 1 }}.{{ qIndex + 1 }}</span>
            </template>
            <v-list-item-title class="navigator-question question-title text-truncate">
              {{ localized(itemsById.get(id)?.title ?? {}, survey.defaultLocale) }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="isUnavailable(id)" class="navigator-unavailable-label">
              Not applicable with the current selection
            </v-list-item-subtitle>
            <template #append>
              <v-progress-circular
                  v-if="progressFor(id).total > 1 && statusFor(id) === 'partial'"
                  :model-value="progressFor(id).completed / progressFor(id).total * 100"
                  color="primary"
                  size="17"
                  width="3"
              />
              <v-icon
                  v-else
                  :color="statusFor(id) === 'answered' ? 'success' : statusFor(id) === 'unanswered' ? 'primary' : 'grey-lighten-1'"
                  :icon="statusFor(id) === 'answered' ? 'mdi-check-circle-outline' : 'mdi-circle-outline'"
                  size="18"
              />
            </template>
          </v-list-item>
        </template>
      </v-list>

      <v-divider class="legend-divider mt-3 mb-3" />
      <div class="navigator-legend d-flex ga-4 ui-metadata text-medium-emphasis">
        <span><v-icon color="success" size="16">mdi-check-circle-outline</v-icon> Answered</span>
        <span><v-icon color="primary" size="16">mdi-circle-outline</v-icon> Unanswered</span>
        <span><v-icon color="grey-lighten-1" size="16">mdi-circle-outline</v-icon> Not visited</span>
      </div>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.question-rail {
  border-left: 1px solid var(--pulse-navigation-border);
  background: var(--pulse-navigation-bg);
  min-height: 0;
  overflow: hidden;
}

.question-rail--hidden {
  align-items: center;
}

.question-rail-hidden-heading {
  justify-content: center;
  width: 100%;
  padding: 8px 4px;
}

.question-rail-hidden-heading > span {
  display: none;
}

.question-rail-hidden-heading .hide-button {
  min-width: 40px;
  padding-inline: 4px;
}

.navigator-content {
  min-height: 0;
  flex: 1 1 auto;
}

.navigator-heading {
  color: rgba(var(--v-theme-on-surface), .92);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -.01em;
}

.hide-button {
  color: rgb(var(--v-theme-primary)) !important;
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
}

.navigator-filter {
  flex: 0 0 auto;
}

.question-list {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.navigator-section {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 40px;
  padding: 24px 12px 24px 0;
  background: var(--pulse-navigation-bg);
  color: rgba(var(--v-theme-on-surface), .68);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: .01em;
}

.navigator-section :deep(.v-list-subheader__text) {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
}

.navigator-section :deep(.v-list-subheader__text > span:nth-child(2)) {
  min-width: 0;
  flex: 1 1 auto;
}

.section-nav-heading--active {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.section-nav-number {
  display: inline-block;
  min-width: 20px;
  margin-right: 2px;
  font-size: 13px;
  font-weight: 500;
}

.question-nav-item {
  min-height: 36px !important;
  margin: 2px 0;
  padding: 0 12px 0 26px;
}

.question-nav-item .v-list-item__content {
  min-width: 0;
}

.question-nav-item :deep(.v-list-item__prepend) {
  min-width: 42px;
}

.question-nav-item :deep(.v-list-item__append) {
  padding-inline-start: 12px;
}

.question-number {
  color: rgba(var(--v-theme-on-surface), .72);
  font-size: 13px;
}

.question-title {
  color: rgba(var(--v-theme-on-surface), .88);
  font-size: 14px !important;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: .01em;
}

.question-nav-item :deep(.v-list-item__overlay) {
  background: transparent;
}

.question-nav-item.v-list-item--active {
  background: rgba(var(--v-theme-primary), .09);
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), .08);
}

.question-nav-item.v-list-item--active .question-number,
.question-nav-item.v-list-item--active .question-title {
  color: rgba(var(--v-theme-on-surface), .98);
}

.question-nav-item--unavailable {
  cursor: default;
  opacity: .62;
}

.question-nav-item--unavailable .question-title {
  color: rgba(var(--v-theme-on-surface), .72);
}

.navigator-unavailable-label {
  font-size: 12px;
  line-height: 1.35;
}

.legend-divider {
  flex: 0 0 auto;
}

.navigator-legend {
  flex: 0 0 auto;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 4px;
}

.navigator-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
</style>
