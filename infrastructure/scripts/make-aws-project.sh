#!/bin/bash

#
# This script is used to bootstrap creating AWS project that will be terraformed.
#
# The script must be run by a user with aws setup with
# organisational admin rights.
#

set -euo pipefail

echo "Using $1"

PROJECT_NAME=$1
if [[ -z "${PROJECT_NAME}" ]]; then
  echo "Project name required."
  exit 1
fi

if [[ -z "${AWS_PROFILE}" ]]; then
  echo "Profile name [default]."
  AWS_PROFILE=ltp-${PROJECT_NAME}
fi

export AWS_SDK_LOAD_CONFIG=1

#
# Create a bucket for terraform to store its state. The name
# of bucket must be globally unique.
#
export TF_BUCKET_NAME="terraform-state-ltp-${PROJECT_NAME}"
export TF_BUCKET_URI="s3://${TF_BUCKET_NAME}"

echo "aws s3 mb --profile ${AWS_PROFILE} --region ap-southeast-2 ${TF_BUCKET_URI}"
echo "aws s3api put-bucket-versioning --bucket ${TF_BUCKET_NAME} --profile ${AWS_PROFILE} --versioning-configuration Status=Enabled"

export bucket=$(aws s3 ls --profile ${AWS_PROFILE} | grep "$TF_BUCKET_NAME")
if [[ -z "$bucket" ]]; then
  echo "Creating terraform configuration bucket '${TF_BUCKET_NAME}'"
  aws s3 mb --profile ${AWS_PROFILE} --region ap-southeast-2 ${TF_BUCKET_URI}
  aws s3api put-bucket-versioning --bucket ${TF_BUCKET_NAME} --profile ${AWS_PROFILE} --versioning-configuration Status=Enabled
else
  echo "Terraform state bucket exists '${TF_BUCKET_NAME}'"
fi

exit 0
