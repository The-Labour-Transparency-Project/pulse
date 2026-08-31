import type {SurveyDefinition} from "./survey";

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
    submissionMessage: string;
    nextStep: string;
}

export function introductionFor(survey: SurveyDefinition): SurveyIntroduction {
    return {
        title: survey.title[survey.defaultLocale] ?? Object.values(survey.title)[0] ?? "Survey",
        purpose: "The Labour Transparency Project is building a clearer picture of labour practices, confidence and transparency across New Zealand agriculture and horticulture.",
        description: "This survey asks about your experience and views. You do not need to be an expert in forced labour, people trafficking or labour assurance to take part. “Don’t know” is a useful answer. The survey will be repeated over time so we can understand where confidence is improving and where gaps remain. All questions are optional.",
        estimatedMinutes: 10,
        privacy: "Your survey responses are not linked to your email address. Results will only be reported in aggregate. Published outputs do not identify individual respondents or reproduce free-text responses.",
        reporting: "Research findings will be combined across respondents. Small groups are protected by minimum-group reporting rules.",
        autosave: "Your responses are saved automatically as you go, so you can return and continue later on this device. You can return to any question and review your answer at any time.",
        verification: "To submit, you will need a code sent to your email address. This helps ensure that real people are answering the form. No email address or personal information is stored as part of this verification process. Read Tips & Guidance to learn more. You can complete verification at any time before submitting the survey.",
    };
}

export function outroFor(survey: SurveyDefinition): SurveyOutro {
    const title = survey.title[survey.defaultLocale] ?? Object.values(survey.title)[0] ?? "Survey";
    return {
        title: "Thank you for taking part",
        description: "You have reached the end of the " + title + " survey.",
        completionMessage: "Your responses remain saved on this device. You can return to the survey or open Review & submit whenever you are ready.",
        submissionMessage: "Thank you for contributing to the Labour Transparency Project. Once enough responses have been received to protect anonymity, you will be able to see how your responses compare with the aggregated results. Where comparable information is available, you will also be able to see how industry views have changed over time. The results will contribute to the Labour Transparency Project's annual reporting on labour confidence, visibility and transparency across New Zealand agriculture and horticulture.",
        nextStep: "Review is optional: unanswered questions are highlighted for awareness, but you can submit a partial response at any time.",
    };
}

export const guidanceItems: GuidanceItem[] = [
    {
        id: "order",
        kind: "tip",
        scope: "survey",
        title: "Answer in any order",
        body: "Use the question navigator to jump to any question. You can return to unanswered questions whenever you are ready."
    },
    {
        id: "dont-know",
        kind: "tip",
        scope: "survey",
        title: "“Don’t know” is useful",
        body: "You do not need to be an expert in forced labour, people trafficking or labour assurance. Choose “Don’t know” when you are unsure."
    },
    {
        id: "optional",
        kind: "info",
        scope: "survey",
        title: "All questions are optional",
        body: "You can skip any question and submit a partial response whenever you are ready."
    },
    {
        id: "autosave",
        kind: "info",
        scope: "survey",
        title: "Responses save automatically",
        body: "Your progress is kept as you answer, including when you move between the Introduction and survey sections. Saved responses remain on this device."
    },
    {
        id: "review",
        kind: "info",
        scope: "survey",
        title: "Review your answers",
        body: "You can return to any question and review or change your answer at any time."
    },
    {
        id: "unanswered",
        kind: "tip",
        scope: "survey",
        title: "Find unanswered questions",
        body: "Previous unanswered and Next unanswered move between questions that still need your attention."
    },
    {
        id: "why",
        kind: "info",
        scope: "survey",
        title: "Why these questions are asked",
        body: "The survey is designed to understand confidence, practices and experiences across labour supply chains."
    },
    {
        id: "privacy",
        kind: "warning",
        scope: "survey",
        title: "Protecting your privacy",
        body: "Please avoid including names, email addresses or other direct identifiers in free-text answers."
    },
    {
        id: "submission-verification",
        kind: "info",
        scope: "survey",
        title: "Your token protects your anonymity",
        body: "We email you a secure token that contains no personally identifiable information. Because it is digitally signed by us, it proves that you are authorised to submit a response, helping prevent spam and automated submissions without identifying you. We do not store a copy, and only you have access to it. The token simply proves that we agreed you could take part, not who you are or how you responded."
    },
];
