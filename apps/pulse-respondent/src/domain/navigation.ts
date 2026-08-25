import type { SurveyDefinition } from "./survey";

export type SurveyDestination =
  | { type: "introduction" }
  | { type: "question"; sectionId: string; questionId?: string }
  | { type: "review" }
  | { type: "outro" };

export type GuidanceKind = "tip" | "info" | "warning" | "error";

export interface GuidanceItem {
  id: string;
  kind: GuidanceKind;
  title: string;
  body: string;
  scope?: "survey" | "section" | "question";
}

export interface SurveyIntroduction {
  title: string;
  purpose: string;
  description: string;
  estimatedMinutes: number;
  privacy: string;
  reporting: string;
  autosave: string;
  verification: string;
}

export interface SurveyOutro {
  title: string;
  description: string;
  completionMessage: string;
  nextStep: string;
}

export function introductionFor(survey: SurveyDefinition): SurveyIntroduction {
  return {
    title: survey.title[survey.defaultLocale] ?? Object.values(survey.title)[0] ?? "Survey",
    purpose: "Help build a clearer picture of how confidence in labour supply chains is established, demonstrated and maintained.",
    description: "Your experience and perspective will help inform evidence-led research. Please answer the questions that are relevant to your work.",
    estimatedMinutes: 10,
    privacy: "Responses are treated confidentially and reported in aggregate. Published outputs do not identify individual respondents or reproduce free-text responses.",
    reporting: "Research findings will be combined across respondents. Small groups are protected by minimum-group reporting rules.",
    autosave: "Your responses are saved automatically as you go, so you can return and continue later on this device.",
    verification: "To submit, you will need a code sent to your email address. This helps ensure that real people are answering the form. No email address or personal information is stored as part of this verification process. Read Tips & Guidance to learn more. You can complete verification at any time before submitting the survey.",
  };
}

export function outroFor(survey: SurveyDefinition): SurveyOutro {
  const title = survey.title[survey.defaultLocale] ?? Object.values(survey.title)[0] ?? "Survey";
  return {
    title: "Thank you for taking part",
    description: "You have reached the end of the " + title + " survey.",
    completionMessage: "Your responses remain saved on this device. You can return to the survey or open Review & submit whenever you are ready.",
    nextStep: "Review is optional: unanswered questions are highlighted for awareness, but you can submit a partial response at any time.",
  };
}

export const guidanceItems: GuidanceItem[] = [
  { id: "order", kind: "tip", scope: "survey", title: "Answer in any order", body: "Use the question navigator to jump to any question. You can return to unanswered questions whenever you are ready." },
  { id: "autosave", kind: "info", scope: "survey", title: "Responses save automatically", body: "Your progress is kept as you answer, including when you move between the Introduction and survey sections." },
  { id: "unanswered", kind: "tip", scope: "survey", title: "Find unanswered questions", body: "Previous unanswered and Next unanswered move between questions that still need your attention." },
  { id: "why", kind: "info", scope: "survey", title: "Why these questions are asked", body: "The survey is designed to understand confidence, practices and experiences across labour supply chains." },
  { id: "privacy", kind: "warning", scope: "survey", title: "Protecting your privacy", body: "Please avoid including names, email addresses or other direct identifiers in free-text answers." },
  { id: "submission-verification", kind: "info", scope: "survey", title: "Submission verification", body: "A code sent to your email address will be required when you submit. The verification process does not store your email address or personal information." },
];
