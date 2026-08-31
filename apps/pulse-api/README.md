# Pulse API

The ASP.NET Core backend for survey delivery, response capture, research
workflows, data access, benchmark products, and publishing APIs.

The first vertical slice is a stateless respondent access and response API:

```text
POST /token -> seven-day wave-scoped credential with compact survey-scoped deterministic HMAC identity -> signed credential -> SES link or direct refresh response
PUT /response -> token claims -> immutable S3 JSON response version
GET /response/latest -> token claims -> latest S3 object
```

Domain logic belongs here when it protects research quality or data ownership:
instrument versions, eligibility, response lifecycle, consent, provenance,
aggregation rules, and publication status. Keep transport concerns separate
from those domain rules as the service grows.

The existing `schemas/survey-response.schema.json` document is stored as the
`response` member of a server-owned envelope. The server owns respondent ID,
response version, and received timestamp; clients cannot choose the S3 key or
those values. Email addresses and bearer credentials are never stored in
response documents. The Development profile uses the local email provider,
which logs the access email, URL, and bearer token to the console for
development only. AWS environments use SES and must set `EmailProvider` to
`Aws`.

Required runtime configuration is supplied by environment variables or AWS
configuration/secret references, not committed files:

`S3BucketName`, `RespondentBaseUrl`, `SesSender`, `SesConfigurationSetName`,
`EmailProvider`, `AllowedWaveIds`, `MaximumResponseBytes`,
`TokenLifetimeDays`, `RespondentIdentityKey`, and `TokenSigningKey`.
`SesConfigurationSetName` is
optional for local development and is set to `labour-transparency` in
production Terraform.

AWS environments use the Lambda execution role through the AWS SDK default
credential chain. No IAM user, access key, or SES SMTP credential is required.

CORS origins are configured with `Cors:AllowedOrigins` (or the equivalent
environment-variable keys). The default is
`https://survey.labourtransparency.com`; Development overrides it with
`http://localhost:5173`.

Both key values are base64-encoded secrets of at least 32 bytes. The identity
key is persistent application data: changing it changes every respondent
namespace. Shared mailboxes intentionally provide shared access under this
model, and changing an email address creates a new respondent identity.

Terraform compositions for LocalStack and AWS live under `infrastructure`.

Local development stores response objects in persistent MinIO. A direct
`dotnet run` uses `http://localhost:19000`; the Lambda running inside
LocalStack uses `http://s3:9000`. LocalStack remains responsible for Lambda,
IAM, and local AWS emulation. Production leaves the S3 endpoint unset, so the
AWS SDK uses the Lambda execution role and AWS S3.

The response repository uses AES256 server-side encryption by default for AWS
S3. It automatically omits the encryption request header for configured
S3-compatible endpoints such as local MinIO, which does not have a KMS by
default. `UseS3ServerSideEncryption` can explicitly override this behaviour.

Tokens use a compact positional payload `[waveId, respondentHash, iat, exp]`,
where `iat` and `exp` are Unix timestamps. An unexpired token can be refreshed
by posting it with the matching email address to `/token`; refresh responses
return the replacement token and its timestamps directly. The token lifetime is
configured with `TokenLifetimeDays` and defaults to seven days.

The default wave is `pulse-2026`, mapped to survey
`ltp.supply-chain-confidence` version `1.0.2`. Its opening and closing dates
are configurable with `WaveOpensAt` and `WaveClosesAt`. The wave also stores a
`DefaultWaveValidSurveyVersions` SemVer rule string, defaulting to `*`; that rule is not evaluated
yet.

The client resolves the wave's survey ID and version from its published survey
configuration; the API resolves them from its wave definition when validating
and storing responses. Response reads and writes are rejected after the wave
closing time, independently of token expiry.

The application keeps AWS concerns behind the S3 and SES adapters so that work can
be added without changing the core identity or response rules. The SES
configuration set is supplied on each AWS `SendEmail` request so future event
destinations can be added to the configuration set without changing the send
workflow.

## Acceptance tests

Acceptance tests use xUnit with FluentAssertions and exercise the running API
through `WebApplicationFactory<Program>`. Test-only dependencies, such as the
email sender and response repository, are replaced through DI in
`ApiApplicationFixture`; new tests should follow the same pattern and should
not call AWS services directly.

Run the API test solution from this directory so the local `global.json` selects
the Microsoft Testing Platform runner:

```sh
dotnet test Api.sln --no-restore
```
