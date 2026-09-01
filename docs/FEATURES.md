# Feature checklist

This is the working delivery list for Labour Transparency Pulse. Check an item
only when it is implemented, tested, and usable in the relevant workflow.

## Foundation

- [x] Versioned Labour Transparency Pulse v1 instrument exists
- [x] Survey-definition and survey-response schemas exist
- [x] Use stable semantic item IDs prefixed by their survey section
- [x] Respondent app loads the versioned instrument
- [x] Respondent app renders every currently supported answer type
- [x] Respondent app renders localized item instructions independently from titles and descriptions
- [x] Respondent app typechecks and builds
- [ ] Add automated validation that the instrument conforms to its JSON Schema
- [ ] Resolve or explicitly approve the instrument's unresolved source items

## Respondent navigation and orientation

- [x] Support single continuous-list, paginated-section, and one-question-at-a-time views
- [x] Show persistent overall progress
- [x] Show section-level progress
- [x] Show blue circular section progress in the question navigator
- [x] Provide next and previous navigation
- [x] Find the next unanswered item
- [x] Find the previous unanswered item
- [x] Support arrow-key shortcuts for question navigation controls
- [x] Provide a section and question navigator
- [x] Keep the active question visible in the question navigator
- [x] Pin the current page title above its nested questions in the navigator viewport
- [x] Anchor mobile section selections at the section heading while preserving desktop question focus
- [x] Keep the section navigator scrollable while keeping its autosave notice visible and closable
- [x] Keep question navigation controls within the middle canvas and provide a dismissible navigation tip
- [x] Keep question navigation controls fixed below independently scrolling question content
- [ ] Keep the dismissible tip banner as a full-width bottom overlay
- [x] Represent the Introduction as a navigable survey destination
- [x] Explain the survey scope, repeat-wave purpose, optional questions, and valid “Don’t know” responses in the
  Introduction
- [x] Start new respondent sessions on the Introduction and preserve the working position
- [x] Provide a navigable Outro destination after the final question
- [x] Provide optional Review & submit navigation with partial submission support
- [x] Tell respondents they can return to and review answers at any time
- [ ] Allow respondents to add a separate comment to each answer
- [x] Provide an optional Tips & Guidance rail with semantic guidance types
- [x] Keep survey guidance separate from contextual warnings and errors
- [ ] Hide and show the question navigator panel
- [x] Allow desktop users to resize the left, right, and Tips & Guidance panels
- [x] Remember panel widths independently for each breakpoint
- [x] Show answered, unanswered, and not-visited status
- [x] Show partial and complete progress for matrix answer rows in all navigation views
- [x] Keep unavailable dependent questions in the navigator as disabled entries
- [x] Wrap matrix labels and headings within responsive table cells
- [x] Provide mobile-friendly navigation controls
- [x] Force continuous view on xs while restoring the prior view mode above xs
- [x] Remember the preferred view mode across browser sessions
- [x] Remember the current section and question across browser sessions
- [x] Keep mobile navigation controls fixed and usable at the xs breakpoint
- [x] Unobstrusive more information if provided
- [x] Establish a clear survey-content and application-chrome typography hierarchy
- [x] Use sequential question numbers for reporting, including conditionally unavailable items

- [ ] Jump directly to a section or question (including from url)
- [ ] Preserve the current position while navigating
- [ ] Restore the respondent's last position when reopening
- [x] Restore the Introduction, Review & submit, and Outro destination after refresh
- [x] Save a recoverable local draft and support resuming
- [x] Hydrate saved answers and progress after a browser refresh
- [ ] Support keyboard- and screen-reader-friendly navigation
- [ ] Keep the current section and question context visible

### Schema answer types

The survey-definition schema declares six answer types. The checklist reflects
the current respondent renderer registry and the types present in v1.

- [x] Render `content`
- [x] Render `singleSelect`
- [x] Render `multiSelect`
- [x] Support explicit list and matrix layouts for `multiSelect`
- [x] Enforce multi-select minimum and maximum selection limits from instrument validation
- [x] Render `matrixSingleSelect`
- [x] Render `integerScale`
- [x] Render `longText`
- [x] Provide a persistent light/dark mode toggle

- [x] Render conditional/detail questions, including `context.primary-sector`
- [x] Derive filtered conditional primary choices from selected options and clear stale dependent answers
- [x] Keep unavailable dependent questions visible with an explanation instead of silently hiding them
- [ ] Enforce required answers and item-level validation
- [ ] Add consent capture and review-before-submit
- [x] Serialize answers to `survey-response.schema.json`
- [x] Add submit, retry, success, and failure states
- [x] Require a persisted signed-token email verification before response submission
- [x] Clear the pending email and token and focus the email field when using another email
- [x] Bounce repeat access-link requests for the same email in the browser cooldown window
- [x] Consume time-limited signed access tokens from `t` links and remove them from browser history
- [x] Allow verified respondents to clear verification with a duplicate-submission warning
- [x] Allow respondents to clear all answers without clearing verification
- [x] Allow verified respondents to clear verification from Review & submit and Outro
- [x] Preserve a recoverable draft locally

## API and data stewardship

- [x] Create the ASP.NET Core `pulse-api` project
- [x] Add xUnit integration-test startup with constructor injection and opt-in S3 lifecycle setup
- [x] Test the Minimal API through `WebApplicationFactory<Program>` with test services composed through DI
- [ ] Serve a published survey definition by ID and version
- [x] Accept and validate response submissions
- [x] Persist submissions with provenance and completion status
- [ ] Add idempotency and safe retry handling
- [x] Add privacy-preserving response access for research operations
- [x] Derive deterministic survey-scoped respondent identities from normalised email via HMAC
- [x] Issue seven-day signed respondent credentials and recover access through SES email
- [x] Refresh an unexpired respondent credential with the credential and matching email
- [x] Keep respondent credentials compact by carrying only the wave and a 64-bit respondent checksum
- [x] Support local console email delivery with token logging and AWS SES delivery by environment setting
- [x] Use the local log email strategy for both direct and LocalStack API development
- [x] Provision the local SES sender identity for LocalStack
- [x] Store immutable response versions in an S3-derived respondent namespace
- [x] Scope respondent credentials, drafts, responses, and S3 keys by wave ID
- [x] Provide a configurable CORS policy for the respondent app
- [x] Configure respondent API URLs through `VITE_PULSE_API_BASE_URL`
- [x] Provide non-mutating S3 diagnostics with classified server-side failure logs
- [x] Retry response save once after S3 provisioning when storage is unavailable

## Research operations

- [ ] Scaffold the internal console
- [ ] Add fieldwork and response-quality overview
- [ ] Add instrument version and publication-status controls
- [ ] Add controlled cohort and eligibility configuration
- [ ] Add aggregate-only reporting with minimum-group suppression

## Published intelligence

- [ ] Define approved aggregate metrics for the 2026 wave
- [ ] Give respondents access to anonymity-protected comparisons with aggregate results when enough responses have been
  received
- [ ] Build a reproducible analysis/reporting pipeline
- [ ] Scaffold the public insights application
- [ ] Publish methodology, scope, limitations, and dataset provenance
- [ ] Add disclosure review before public release

## Delivery hygiene

- [x] Provide local and LocalStack respondent dev build targets
- [x] Provide one repeatable managed Lambda packaging process for local and production Terraform
- [ ] Add workspace-level checks and CI
- [x] Add local API development environment using LocalStack and persistent MinIO response storage
- [x] Use a predictable LocalStack Lambda Function URL subdomain
- [x] Provision the production Lambda, Function URL, private S3, SES permissions, logging, and TeamCity-injected secret
  environment with Terraform
- [x] Provision shared SES domain sending identity, DKIM, custom MAIL FROM, configuration set, and scoped runtime IAM
  permissions with external-DNS and SES-production-access guidance
- [x] Document deployment configuration and secret handling
- [x] Add a privileged Provisioner Factory with controlled provisioner users and group policy
- [ ] Add accessibility and privacy review checklists
