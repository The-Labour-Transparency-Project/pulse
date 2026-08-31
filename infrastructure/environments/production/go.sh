#!/usr/bin/env bash

set -euo pipefail

# aws configure --profile ltp-prod

echo 'using AWS_PROFILE ltp-prod'
export AWS_PROFILE=ltp-prod
echo 'loading from config'
export AWS_SDK_LOAD_CONFIG=1

MODE=${1:-bash}

echo `pwd`
exec ../../go-env.sh $MODE
