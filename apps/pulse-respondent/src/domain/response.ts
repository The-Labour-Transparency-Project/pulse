import { evaluateExpression, isAnswered, type Answers, type DetailAnswers, type SurveyDefinition, type SurveyItem } from './survey'

export interface SerializedAnswer {
  id: string
  itemId: string
  rowId?: string
  value: unknown
  selectedOptionIds?: string[]
  numericValue?: number
  textValue?: string
  optionSemantics?: string[]
  presented?: boolean
  skippedReason?: 'notPresented' | 'unanswered'
}

export interface SurveyResponse {
  responseSchemaVersion: '1.0.0'
  submissionId: string
  surveyId: string
  surveyVersion: string
  wave?: string
  submittedAt: string
  completionStatus: 'complete' | 'partial' | 'abandoned'
  longitudinalToken: null
  answers: SerializedAnswer[]
  metadata: []
}

export interface SerializeResponseOptions {
  submissionId?: string
  submittedAt?: string
  completionStatus?: SurveyResponse['completionStatus']
  wave?: string
  createId?: () => string
}

const defaultId = () => crypto.randomUUID()

function skippedAnswer(itemId: string, createId: () => string, reason: 'notPresented' | 'unanswered', rowId?: string): SerializedAnswer {
  return { id: createId(), itemId, ...(rowId ? { rowId } : {}), value: null, presented: reason !== 'notPresented', skippedReason: reason }
}

function optionSemantics(item: SurveyItem, selectedOptionIds: string[], survey: SurveyDefinition): string[] {
  const options = survey.optionSets.flatMap((set) => set.options)
  return selectedOptionIds
    .map((id) => options.find((option) => option.id === id)?.semantics?.kind)
    .filter((kind): kind is string => Boolean(kind))
}

function serializeValue(item: SurveyItem, value: Exclude<Answers[string], undefined>, survey: SurveyDefinition, createId: () => string, rowId?: string): SerializedAnswer {
  const answer: SerializedAnswer = { id: createId(), itemId: item.id, ...(rowId ? { rowId } : {}), value, presented: true }

  if (typeof value === 'number') answer.numericValue = value
  if (typeof value === 'string' && (item.kind === 'longText' || item.kind === 'content')) answer.textValue = value
  if (typeof value === 'string' && (item.kind === 'singleSelect' || item.kind === 'matrixSingleSelect')) {
    answer.selectedOptionIds = [value]
    answer.optionSemantics = optionSemantics(item, [value], survey)
  }
  if (Array.isArray(value)) {
    answer.selectedOptionIds = [...value]
    answer.optionSemantics = optionSemantics(item, value, survey)
  }
  return answer
}

/** Convert the respondent state into the versioned response envelope.
 *  Every answerable item is represented, including hidden and unanswered items,
 *  so downstream analysis can distinguish non-response from non-applicability.
 */
export function serializeSurveyResponse(
  survey: SurveyDefinition,
  answers: Answers,
  detailAnswers: DetailAnswers = {},
  options: SerializeResponseOptions = {},
): SurveyResponse {
  const createId = options.createId ?? defaultId
  const serialized: SerializedAnswer[] = []

  for (const item of survey.items) {
    if (item.kind === 'content') continue
    const presented = evaluateExpression(item.visibleWhen, answers)
    const value = answers[item.id]

    if (item.kind === 'multiSelect' && item.layout === 'matrix') {
      for (const row of item.rows ?? []) {
        const rowValue = value && typeof value === 'object' && !Array.isArray(value)
          ? (value as Record<string, string[]>)[row.id]
          : undefined
        serialized.push(presented && rowValue?.length
          ? serializeValue(item, rowValue, survey, createId, row.id)
          : skippedAnswer(item.id, createId, presented ? 'unanswered' : 'notPresented', row.id))
      }
      continue
    }

    if (item.kind === 'matrixSingleSelect') {
      for (const row of item.rows ?? []) {
        const rowValue = value && typeof value === 'object' && !Array.isArray(value)
          ? (value as Record<string, string>)[row.id]
          : undefined
        serialized.push(presented && rowValue
          ? serializeValue(item, rowValue, survey, createId, row.id)
          : skippedAnswer(item.id, createId, presented ? 'unanswered' : 'notPresented', row.id))
      }
      continue
    }

    if (presented && isAnswered(value)) serialized.push(serializeValue(item, value!, survey, createId))
    else serialized.push(skippedAnswer(item.id, createId, presented ? 'unanswered' : 'notPresented'))

    const selected = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
    for (const optionId of selected) {
      const detail = detailAnswers[`${item.id}::${optionId}`]
      if (detail !== undefined && detail !== '') {
        serialized.push({
          id: createId(), itemId: item.id, value: detail, textValue: detail,
          selectedOptionIds: [optionId], optionSemantics: optionSemantics(item, [optionId], survey), presented: true,
        })
      }
    }
  }

  return {
    responseSchemaVersion: '1.0.0',
    submissionId: options.submissionId ?? createId(),
    surveyId: survey.id,
    surveyVersion: survey.version,
    ...((options.wave ?? survey.versioning?.wave) ? { wave: options.wave ?? survey.versioning?.wave } : {}),
    submittedAt: options.submittedAt ?? new Date().toISOString(),
    completionStatus: options.completionStatus ?? 'partial',
    longitudinalToken: null,
    answers: serialized,
    metadata: [],
  }
}

export const serializeAnswers = serializeSurveyResponse
