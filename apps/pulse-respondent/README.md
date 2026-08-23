# Pulse Respondent

The public respondent-facing survey experience. It is designed for clear,
accessible participation, reliable progress through a named survey instrument,
and safe submission of responses.

Planned stack: Vue 3, TypeScript, and Vuetify.

Survey definitions are consumed from `packages/survey-schema`; response
ownership, validation, and persistence are enforced by `apps/pulse-api`.

Each survey item may provide localized `instruction` and `description` text.
The respondent UI renders both independently below the localized item title,
using the active locale and falling back to the first available translation.
