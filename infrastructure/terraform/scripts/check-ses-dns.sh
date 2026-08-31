#!/usr/bin/env bash
set -euo pipefail

command -v dig >/dev/null || { echo "dig is required" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

terraform_dir="$(cd "$(dirname "$0")/../../environments/production" && pwd)"
# Keep the credential setup used by environments/production/go.sh when this
# script is invoked directly from any working directory.
export AWS_PROFILE="${AWS_PROFILE:-ltp-prod}"
export AWS_SDK_LOAD_CONFIG=1
dkim="$(terraform -chdir="$terraform_dir" output -json ses_dkim_dns_records)"
mail_from="$(terraform -chdir="$terraform_dir" output -json ses_mail_from_dns_records)"
dmarc="$(terraform -chdir="$terraform_dir" output -json ses_dmarc_dns_record)"

normalise() {
  sed -e 's/[".]$//' -e 's/^"//' -e 's/"$//' | tr '[:upper:]' '[:lower:]' | sed '/^$/d'
}

check_record() {
  local type="$1" name="$2" expected="$3" actual
  actual="$(dig +short "$type" "$name" | normalise)"
  expected="$(printf '%s\n' "$expected" | normalise)"
  if [[ "$actual" == "$expected" ]]; then
    printf 'OK   %-5s %s -> %s\n' "$type" "$name" "$actual"
  else
    printf 'WAIT %-5s %s\n     expected: %s\n     found:    %s\n' "$type" "$name" "$expected" "${actual:-<no answer>}"
    return 1
  fi
}

failed=0
while IFS= read -r record; do
  check_record CNAME "$(jq -r '.name' <<<"$record")" "$(jq -r '.value' <<<"$record")" || failed=1
done < <(jq -c '.[]' <<<"$dkim")

while IFS= read -r record; do
  check_record "$(jq -r '.type' <<<"$record")" "$(jq -r '.name' <<<"$record")" "$(jq -r '.value' <<<"$record")" || failed=1
done < <(jq -c '.[]' <<<"$mail_from")

check_record TXT "$(jq -r '.name' <<<"$dmarc")" "$(jq -r '.value' <<<"$dmarc")" || failed=1
exit "$failed"
