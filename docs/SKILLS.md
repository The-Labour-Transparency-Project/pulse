# Project skills and workflows

These are project workflows, not replacements for Codex's installed runtime
skills. They describe the capabilities agents should apply consistently.

## Instrument stewardship

- Read the survey definition and JSON Schema before changing survey behaviour.
- Preserve stable item and option IDs across waves.
- Record unresolved source material instead of inventing wording or semantics.
- Validate the complete definition before calling an instrument publishable.

## Respondent experience

- Render from the versioned definition rather than duplicating survey content
  in components.
- Support keyboard use, clear validation, recoverable errors, and visible
  progress.
- Serialize answers into the response schema with explicit skipped and
  non-response semantics.

## Research data quality

- Keep completion status, consent, provenance, and survey version on every
  submission.
- Apply minimum-group-size and suppression rules before aggregation or
  publication.
- Never publish verbatim free text without an approved redaction workflow.

## Verification

- Typecheck and build changed applications.
- Add focused tests for domain rules and schema boundaries.
- For UI changes, manually verify the primary respondent journey and error
  states.
