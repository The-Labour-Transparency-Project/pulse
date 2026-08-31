#!/usr/bin/env bash

set -euo pipefail

alias tf='terraform'
alias tfv='terraform validate'
alias tfi='terraform init'
alias tfp='terraform plan'
alias tfm='terraform fmt -recursive'

export TF_LOG=TRACE
export TF_LOG_PATH=./terraform.logs

MODE=${1:-plan}

case "$MODE" in
plan)
  terraform init
  terraform plan
  ;;
apply)
  terraform apply -auto-approve
  ;;
bash)
  bash
  ;;
*)
  echo "Mode flag unknown '$MODE'"
  echo $"Usage: {provision}"
  exit 92
  ;;
esac
