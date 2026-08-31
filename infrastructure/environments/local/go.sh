#!/usr/bin/env bash

set -e

# For LocalStack, terraform still expects AWS-style credentials to exist because the AWS provider validates them,
# but they can be dummy values.
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=testtest
export AWS_DEFAULT_REGION=ap-southeast-2

MODE=${1:-bash}

echo `pwd`
if [[ "$MODE" == "apply" ]]; then
  ../../go-env.sh apply

  # The shared backend module preserves Lambda environment variables so
  # production secret injection is not overwritten. Apply the local-only
  # MinIO bridge after Terraform updates the LocalStack Lambda.
  variables=$(aws --endpoint-url http://localhost:14566 --region "$AWS_DEFAULT_REGION" \
    lambda get-function-configuration --function-name pulse-api-local \
    --query 'Environment.Variables' --output json)
  variables=$(jq -c '.AWSServiceUrl = "http://s3:9000" |
    .AWS_ACCESS_KEY_ID = "test" |
    .AWS_SECRET_ACCESS_KEY = "testtest"' <<< "$variables")
  environment_file=$(mktemp)
  trap 'rm -f "$environment_file"' EXIT
  jq -n --argjson variables "$variables" '{Variables: $variables}' > "$environment_file"
  aws --endpoint-url http://localhost:14566 --region "$AWS_DEFAULT_REGION" \
    lambda update-function-configuration --function-name pulse-api-local \
    --environment "file://$environment_file" >/dev/null
else
  exec ../../go-env.sh "$MODE"
fi
