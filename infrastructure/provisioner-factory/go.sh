#!/usr/bin/env bash

set -euo pipefail

echo 'using AWS_PROFILE ltp-provisioner-factory'
export AWS_PROFILE=ltp-provisioner-factory
echo 'loading from config'
export AWS_SDK_LOAD_CONFIG=1

MODE=${1:-bash}

echo `pwd`
exec ../go-env.sh $MODE
