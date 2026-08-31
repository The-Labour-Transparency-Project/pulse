<script lang="ts" setup>
import {useDisplay} from "vuetify";
import {
  answerProgress,
  type Answers,
  answerStatus,
  isSelectedOptionsDependent,
  localized,
  type SurveyDefinition,
  type SurveyItem
} from "../../domain/survey";
import type {SurveyDestination} from "../../domain/navigation";
import TipsGuidanceRail from "./TipsGuidanceRail.vue";

const {lgAndUp} = useDisplay();
const props = defineProps<{
  survey: SurveyDefinition;
  answers: Answers;
  itemsById: Map<string, SurveyItem>;
  sectionIndex: number;
  currentQuestionId?: string;
  leftOpen: boolean;
  leftWidth: number;
  rightOpen: boolean;
  tipsOpen: boolean;
  tipsWidth: number;
  destination: SurveyDestination;
  submitted: boolean;
  verificationEmail: string;
  verificationCode: string;
  verificationRequested: boolean;
  verificationVerified: boolean;
  verificationError: string;
  visitedQuestionIds: ReadonlySet<string>;
  visibleItems: SurveyItem[]
}>();
defineEmits<{
  'update:leftOpen': [value: boolean];
  'update:rightOpen': [value: boolean];
  'update:tipsOpen': [value: boolean];
  selectIntroduction: [];
  selectReview: [];
  selectOutro: [];
  selectSection: [index: number];
  selectQuestion: [section: number, item: number]
  'update:email': [value: string];
  'update:code': [value: string];
  requestCode: [];
  confirmCode: [];
  clearVerification: [];
}>();

function statusFor(id: string) {
  const item = props.itemsById.get(id);
  return item ? answerStatus(item, props.answers[id], props.visitedQuestionIds.has(id)) : "notVisited";
}

function isUnavailable(id: string) {
  const item = props.itemsById.get(id);
  return !!item && isSelectedOptionsDependent(item) && !props.visibleItems.some((candidate) => candidate.id === id);
}

function isNavigatorItem(id: string) {
  return props.visibleItems.some((item) => item.id === id) || isUnavailable(id);
}
</script>

<template>
  <template v-if="!lgAndUp">
    <v-navigation-drawer :model-value="leftOpen" :width="leftWidth" class="d-lg-none" temporary
                         @update:model-value="$emit('update:leftOpen', $event)">
      <v-list-item class="py-5" title="Survey navigation"/>
      <v-divider/>
      <v-list nav>
        <v-list-item :active="destination.type === 'introduction'" @click="$emit('selectIntroduction')">
          <v-list-item-title>Introduction</v-list-item-title>
          <v-list-item-subtitle class="destination-subtitle">About this survey</v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-for="(section, index) in survey.sections" :key="section.id"
                     :active="destination.type === 'question' && index === sectionIndex"
                     @click="$emit('selectSection', index)">
          <template #prepend><span class="text-caption mr-3">{{ index + 1 }}</span></template>
          {{ localized(section.title, survey.defaultLocale) }}
        </v-list-item>
        <v-list-item v-if="!submitted" :active="destination.type === 'review'" @click="$emit('selectReview')">
          Review &amp; submit
        </v-list-item>
        <v-list-item v-if="submitted" :active="destination.type === 'outro'" @click="$emit('selectOutro')">
          <v-list-item-title>Outro</v-list-item-title>
          <v-list-item-subtitle class="destination-subtitle">Thank you</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-navigation-drawer :model-value="tipsOpen" :width="tipsWidth" class="d-lg-none" location="right" temporary
                         @update:model-value="$emit('update:tipsOpen', $event)">
      <TipsGuidanceRail :verification-code="verificationCode" :verification-email="verificationEmail"
                        :verification-error="verificationError" :verification-requested="verificationRequested"
                        :verification-verified="verificationVerified"
                        @update:email="$emit('update:email', $event)" @update:code="$emit('update:code', $event)"
                        @request-code="$emit('requestCode')" @confirm-code="$emit('confirmCode')"
                        @clear-verification="$emit('clearVerification')"/>
    </v-navigation-drawer>
    <v-navigation-drawer :model-value="rightOpen" class="d-lg-none" location="right" temporary
                         @update:model-value="$emit('update:rightOpen', $event)">
      <v-list-item class="py-5" title="Question navigator"/>
      <v-divider/>
      <v-list density="compact" nav>
        <template v-for="(section, sIndex) in survey.sections" :key="section.id">
          <v-list-subheader>{{ sIndex + 1 }} · {{ localized(section.title, survey.defaultLocale) }}</v-list-subheader>
          <v-list-item v-for="(id, qIndex) in section.itemIds" v-show="isNavigatorItem(id)" :key="id"
                       :active="currentQuestionId === id" :aria-disabled="isUnavailable(id) ? 'true' : undefined"
                       :disabled="isUnavailable(id)"
                       @click="!isUnavailable(id) && $emit('selectQuestion', sIndex, qIndex)">
            <template #prepend>
              <v-progress-circular v-if="(itemsById.get(id) && statusFor(id) === 'partial')"
                                   :model-value="answerProgress(itemsById.get(id)!, answers[id]).completed / answerProgress(itemsById.get(id)!, answers[id]).total * 100"
                                   color="primary" size="16" width="2"/>
              <v-icon v-else
                      :color="statusFor(id) === 'answered' ? 'success' : statusFor(id) === 'unanswered' ? 'primary' : 'grey-lighten-1'"
                      :icon="statusFor(id) === 'answered' ? 'mdi-check-circle-outline' : isUnavailable(id) ? 'mdi-lock-outline' : 'mdi-circle-outline'"
                      size="16"/>
            </template>
            <span>{{ sIndex + 1 }}.{{ qIndex + 1 }} {{
                localized(itemsById.get(id)?.title ?? {}, survey.defaultLocale)
              }}</span><small v-if="isUnavailable(id)" class="d-block text-medium-emphasis">Not applicable with the
            current selection</small></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>
  </template>
</template>
