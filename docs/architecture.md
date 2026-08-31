# Pulse API architecture

The first backend increment is intentionally stateless and targets ASP.NET
Core on .NET 10 LTS:

```text
POST /token
  waveId + surveyId + surveyVersion + normalised email
    -> HMAC(identity key), then compact checksum
    -> survey-scoped respondentId checksum
    -> long-lived HMAC-signed bearer credential
    -> SES access link

PUT /response and GET /response/latest
  bearer credential
    -> validated wave/respondent claims
    -> immutable JSON object in private S3
```

## Boundaries

- `Core` owns deterministic email normalisation, HMAC respondent identity,
  compact two-part bearer token signing/validation, and bounded response document rules.
- `Infrastructure` owns AWS S3 and SES adapters. S3 keys are built only
  from validated token claims and a server-generated ULID.
- `Api` owns HTTP transport, configuration composition, Lambda hosting,
  and structured operational logging.
- `MicroTests` covers the security-sensitive pure rules.

## Stored response shape

The client submits the existing `schemas/survey-response.schema.json` document.
S3 stores it inside a server-owned envelope containing `waveId`, `surveyId`,
`surveyVersion`, opaque `respondentId`, ULID `responseVersion`, UTC
`receivedAt`, `responseSchemaVersion`, and the original response document.
This keeps response-document schema evolution separate from immutable response
versioning. No email address, token, or SES metadata is stored in the envelope.

S3 keys use:

```text
responses/{surveyId}/{waveId}/{respondentId}/{responseVersion}.json

Each wave is a research profile containing its survey ID, selected survey
version, a stored SemVer rule for valid instrument versions, and opening and
closing timestamps. The selected version identifies the instrument to present;
the SemVer rule is carried as metadata but is not interpreted yet.
```

ULIDs sort chronologically, and lookup scans only that respondent prefix. S3
listing pagination is handled so the latest object remains correct beyond one
listing page.

## Configuration and secrets

`S3BucketName`, `RespondentBaseUrl`, `SesSender`, `AllowedWaveIds`, and
`MaximumResponseBytes` are ordinary configuration. TeamCity supplies
`RespondentIdentityKey` and `TokenSigningKey` to the production Terraform run
as base64-encoded, independent secrets of at least 256 bits. Terraform passes
them to Lambda, which encrypts environment variables at rest. The identity key
must persist across deployment and infrastructure replacement; changing it
changes every deterministic respondent namespace. The production Terraform
state and plan artifacts therefore require secret-level protection.

The API does not use a database, Cognito, client S3 credentials, or expiring
sessions. Shared mailboxes intentionally provide shared access, and a changed
email address is a new identity until a future explicit administrative linking
workflow is designed.

The SES link carries the long-lived signed credential as the `t` query
parameter. Its signed payload contains only `w` (wave ID) and `r` (a compact
16-character hexadecimal checksum of the keyed respondent identity). The
respondent app consumes it on entry, stores it in
survey/version-scoped browser storage, and uses it as the bearer credential for
response access. It immediately rewrites browser history to remove `t` from
the visible URL. The credential grants access to the respondent's survey
material; it must be treated as sensitive and never logged or stored in a
response document.

## Next infrastructure increment

Terraform should provision only the local/LocalStack and AWS resources required
by this boundary: a private encrypted S3 bucket, Lambda execution role and
function, Function URL, CloudWatch log group, SES permissions/configuration,
and environment configuration. LocalStack should use the same
adapter contracts without adding a local database. Rate limiting, CAPTCHA,
full JSON Schema validation, idempotency, and integration tests remain separate
follow-up work rather than hidden infrastructure assumptions.
