#!/usr/bin/env bash
set -euo pipefail

# Keep the credential setup used by environments/production/go.sh when this
# script is invoked directly from any working directory.
export AWS_PROFILE="${AWS_PROFILE:-ltp-prod}"
export AWS_SDK_LOAD_CONFIG=1

: "${AWS_REGION:?AWS_REGION is required}"
: "${PULSE_LAMBDA_FUNCTION:?PULSE_LAMBDA_FUNCTION is required}"
: "${PULSE_S3_BUCKET_NAME:?PULSE_S3_BUCKET_NAME is required}"
: "${PULSE_RESPONDENT_BASE_URL:?PULSE_RESPONDENT_BASE_URL is required}"
: "${PULSE_SES_SENDER:?PULSE_SES_SENDER is required}"
: "${PULSE_ALLOWED_WAVE_IDS:?PULSE_ALLOWED_WAVE_IDS is required}"
: "${PULSE_MAXIMUM_RESPONSE_BYTES:?PULSE_MAXIMUM_RESPONSE_BYTES is required}"
: "${PULSE_RESPONDENT_IDENTITY_KEY:?PULSE_RESPONDENT_IDENTITY_KEY is required}"
: "${PULSE_TOKEN_SIGNING_KEY:?PULSE_TOKEN_SIGNING_KEY is required}"

# Keep this legacy deployment path aligned with the Terraform-managed Lambda
# environment. Defaults match the production composition, while allowing the
# script to remain usable for deliberately out-of-state secret injection.
export PULSE_EMAIL_PROVIDER="${PULSE_EMAIL_PROVIDER:-Aws}"
export PULSE_SES_CONFIGURATION_SET_NAME="${PULSE_SES_CONFIGURATION_SET_NAME:-labour-transparency}"

umask 077
payload="$(mktemp)"
trap 'rm -f "$payload"' EXIT

# Read secrets from the process environment rather than placing them in the
# command line. The temporary request file is removed when this step exits.
jq -n '
{
  FunctionName: env.PULSE_LAMBDA_FUNCTION,
  Environment: {
    Variables: {
      S3BucketName: env.PULSE_S3_BUCKET_NAME,
      RespondentBaseUrl: env.PULSE_RESPONDENT_BASE_URL,
      SesSender: env.PULSE_SES_SENDER,
      EmailProvider: env.PULSE_EMAIL_PROVIDER,
      SesConfigurationSetName: env.PULSE_SES_CONFIGURATION_SET_NAME,
      AllowedWaveIds: env.PULSE_ALLOWED_WAVE_IDS,
      MaximumResponseBytes: env.PULSE_MAXIMUM_RESPONSE_BYTES,
      RespondentIdentityKey: env.PULSE_RESPONDENT_IDENTITY_KEY,
      TokenSigningKey: env.PULSE_TOKEN_SIGNING_KEY
    }
  }
}
' > "$payload"

aws lambda update-function-configuration \
  --region "$AWS_REGION" \
  --cli-input-json "file://$payload"
