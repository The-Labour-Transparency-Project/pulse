# Agent instructions

## Project purpose

Labour Transparency Pulse is an evidence-led research product. Survey
instruments, response data, analysis, and published outputs must remain
traceable to explicit versions and approved research workflows.

## Product north star

Always remember that this code is about building the intelligence layer.
- The survey is the input.
- The data is the asset.
- The insights are the product.
- The reputation and positioning are the business advantage.

Use this north star when choosing what to build and how to prioritise work.
Respondent collection matters because it produces durable, trustworthy data;
data work matters because it enables differentiated insights; and published
insights matter because they build reputation and positioning.

## Working rules

- Read the relevant README and feature checklist before making changes.
- When a user requests a new feature, add it to `docs/FEATURES.md` before or
  alongside implementation, and check it only after it is implemented, tested,
  and usable in the relevant workflow.
- Preserve survey IDs, versions, option semantics, privacy rules, and source
  traceability unless the task explicitly changes the instrument.
- Treat respondent data as sensitive. Do not add direct identifiers or expose
  free-text responses in published outputs.
- Prefer a small end-to-end vertical slice over scaffolding broad abstractions.
- Keep transport, persistence, research-domain rules, and presentation logic
  separate as the API is built.
- Add or update tests for validation, response serialization, and privacy or
  aggregation rules when those areas change.
- Run the narrowest relevant checks, then the workspace checks when practical.

## UI and layout conventions

- Use Vuetify idiomatically wherever possible, especially for layout and
  responsive structure.
- Prefer Vuetify's CSS utility helpers for spacing, display, alignment,
  typography, and responsive behaviour. Inline utility classes often make the
  intent of a layout clearer than a separate stylesheet.
- Prefer a small amount of understandable utility-class duplication over
  prematurely extracting shared CSS. Extract CSS when repetition becomes
  substantial, obscures the layout, or represents a genuine visual primitive.
- When repeated markup or styling remains difficult to understand, consider
  splitting the UI into focused components and sub-components rather than
  forcing reuse through increasingly abstract CSS.
- Component boundaries should improve comprehension and make the respondent,
  research, or publishing workflow easier to reason about.

## Vue composable and state architecture

When building Vue 3 applications with the Composition API and Vuetify,
deliberately separate composables into framework, infrastructure, and domain
categories.

### Framework composables

Use Vuetify composables only for Vuetify and design-system concerns. Use
`useDisplay()` for responsive breakpoints and viewport behaviour, `useTheme()`
for theme state and switching, and `useLocale()` for Vuetify localisation. Do
not recreate Vuetify functionality inside application composables.

```ts
import { useDisplay } from 'vuetify'

const { mobile, mdAndUp } = useDisplay()
```

### Infrastructure composables

Use established Vue ecosystem libraries for common browser primitives. Prefer
`@vueuse/core` for local-storage persistence, browser APIs, online/offline
state, debounce/throttle, clipboard, event listeners, and device capabilities.
For example:

```ts
import { useLocalStorage, useOnline, useDebounceFn } from '@vueuse/core'
```

Avoid manually wrapping browser behaviour, such as using a `watch()` solely to
call `localStorage.setItem()`, when VueUse provides the required behaviour.

### Domain composables

Put application-specific behaviour in project composables. Domain composables
should encapsulate business workflows, hide Pinia implementation details,
coordinate API calls, manage derived state, and provide reusable behaviour to
components. Examples include `useSurvey`, `useSurveySession`,
`useSurveyProgress`, `useAnswer`, `useAutosave`, `useSubmission`, and
`useToken` under `src/composables/`.

Components should consume domain composables rather than directly
manipulating stores, APIs, or browser storage.

### State management

Use Pinia for application state that needs persistence, sharing, or lifecycle
management. Stores such as `useSurveyStore`, `useSessionStore`, and
`useAnswerStore` may own survey definitions, session identity, answers,
submission state, authentication/token state, and application mode.
Composables should expose behaviour over stores.

Keep the dependency direction:

```text
Components -> Domain composables -> Pinia -> VueUse persistence
                                  \-> APIs
```

### Component responsibilities

Components should focus on rendering, user interaction, visual state, and
emitting user intent. Components must not directly call APIs, manipulate
`localStorage`, contain business workflow logic, or know persistence
mechanisms. Avoid placing business rules directly in Vue components.

### Pluggable feature architecture

For systems such as survey engines, design features around renderers and
composable contracts. An `AnswerRenderer` may dispatch to focused components
such as `TextAnswer.vue`, `ChoiceAnswer.vue`, `MatrixAnswer.vue`,
`RankingAnswer.vue`, and `FileAnswer.vue`. Each answer component should use a
shared abstraction such as `useSurveyAnswer()` for storage, validation, and
submission behaviour. New answer types should be addable without modifying
the core survey engine.

When generating code, first decide whether each piece of logic belongs in a
Vuetify composable, VueUse infrastructure composable, domain composable,
Pinia store, or component. Prefer replaceable components, clear boundaries,
testable business logic, reusable workflows, and minimal coupling between UI
and domain behaviour.

## Current priority

The next delivery target is a submit-capable respondent experience backed by a
minimal API response endpoint. See [`docs/FEATURES.md`](docs/FEATURES.md).

## Handoff format

When completing work, report:

1. what changed;
2. checks run and their results;
3. any unresolved research or product decisions; and
4. the next unchecked feature.
