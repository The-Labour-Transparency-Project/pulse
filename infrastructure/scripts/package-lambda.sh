#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
PROJECT_DIR="$REPO_ROOT/apps/pulse-api/src/Api"
ARTIFACT="$REPO_ROOT/apps/pulse-api/artifacts/pulse-api.zip"

MODE="${1:-managed}"

case "$MODE" in
managed)
  command -v dotnet >/dev/null 2>&1 || {
    echo "dotnet is required to package the Lambda" >&2
    exit 1
  }

  if ! dotnet lambda --help >/dev/null 2>&1; then
    echo "Amazon.Lambda.Tools is required. Install it with:" >&2
    echo "  dotnet tool install -g Amazon.Lambda.Tools" >&2
    exit 1
  fi

  mkdir -p "$(dirname -- "$ARTIFACT")"
  dotnet lambda package \
    --project-location "$PROJECT_DIR" \
    --configuration Release \
    --framework net10.0 \
    --function-architecture arm64 \
    --output-package "$ARTIFACT"
  ;;
native-aot)
  cat >&2 <<'EOF'
Native AOT packaging is not enabled for this application yet.
The current API uses Amazon.Lambda.AspNetCoreServer.Hosting with the managed
dotnet10 Lambda runtime. Native AOT requires a tested Lambda bootstrap and a
separate provided.al2023 Terraform configuration.

Run this script without arguments to create the supported managed artifact.
EOF
  exit 2
  ;;
*)
  echo "Usage: $0 [managed|native-aot]" >&2
  exit 2
  ;;
esac

echo "Lambda artifact: $ARTIFACT"
