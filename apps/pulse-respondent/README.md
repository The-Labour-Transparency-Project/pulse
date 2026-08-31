# Pulse Respondent

The public respondent-facing survey experience. It is designed for clear,
accessible participation, reliable progress through a named survey instrument,
and safe submission of responses.

Planned stack: Vue 3, TypeScript, and Vuetify.

Survey definitions are consumed from `packages/survey-schema`; response
ownership, validation, and persistence are enforced by `apps/pulse-api`.

## Respondent access and API URLs

The API base URL is supplied at build time through
`VITE_PULSE_API_BASE_URL`. The respondent uses `POST /token` to request an
access link and `PUT /response` to save a response with an `Authorization:
Bearer <token>` header. `GET /response/latest` is reserved for response
resumption from the API.

The token in the access link is a long-lived, signed bearer credential. It
gives the respondent access to their survey material and authorises saving
responses for that survey. It is not an expiring session and does not contain
their email address. On entry, the app reads the `t` query parameter, stores
the credential in the survey/version-scoped verification storage, and rewrites
browser history to remove `t` from the visible URL. The credential must never
be logged or included in a response document.

Each survey item may provide localized `instruction` and `description` text.
The respondent UI renders both independently below the localized item title,
using the active locale and falling back to the first available translation.

### Local development targets

Run the default respondent development build against the locally running API:

```sh
pnpm dev
```

This is equivalent to `pnpm dev:local` and uses the committed `localdev` mode
configuration for `http://localhost:5100`.

To run against the Docker/LocalStack API instead:

```sh
pnpm dev:localstack
```

The corresponding non-production builds are `pnpm build:local` and
`pnpm build:localstack`. The LocalStack API URL is configured in
`.env.localstack`; the default `pnpm build` and `pnpm build:production` use
the production mode.

The production build uses the committed `.env.production` public API origin.
It points to the durable production Lambda Function URL; it contains no
credentials or respondent data. Production email delivery is configured by
Terraform with the `labour-transparency` SES configuration set.
