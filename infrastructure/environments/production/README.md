# Production

Production environment configuration and operational notes. Production data,
secrets, state, and access policies must be managed through approved cloud
controls and reviewed changes.

The production composition uses AWS Lambda `dotnet10`, a private encrypted S3
response bucket, and SES permissions. TeamCity supplies the two signing keys
to Terraform as `TF_VAR_respondent_identity_key` and
`TF_VAR_token_signing_key`; Terraform passes them into the Lambda .NET runtime.
Because Terraform manages those settings, the secret values are present in
Terraform state and must be protected accordingly. Apply
`infrastructure/provisioner-factory` once; its
`environment_provisioners` map creates the production Terraform state bucket.
Then configure this environment to use the dedicated provisioner user
credentials and migrate its state to the factory-created bucket.

## Shared SES ownership and manual setup

This production state is the deliberate owner of the shared SES resources for
the AWS account and `aws_region`: the `labourtransparency.com` domain identity,
Easy DKIM, `mail.labourtransparency.com` MAIL FROM settings, and the
`labour-transparency` configuration set. Do not add the same resources to the
local state or another environment state. Local targets LocalStack and uses a
non-production sender configuration.

After applying production Terraform, inspect the `ses_dkim_dns_records`,
`ses_mail_from_dns_records`, and `ses_dmarc_dns_record` outputs. These are the
DNS records that must be published by the operator managing
`labourtransparency.com`:

- Three DKIM `CNAME` records: `<token>._domainkey.labourtransparency.com` →
  `<token>.dkim.amazonses.com`.
- One MAIL FROM `MX` record:
  `mail.labourtransparency.com` →
  `10 feedback-smtp.ap-southeast-2.amazonses.com`.
- One MAIL FROM `TXT` SPF record at `mail.labourtransparency.com`:
  `v=spf1 include:amazonses.com ~all`.
- One DMARC `TXT` record at `_dmarc.labourtransparency.com`. The initial
  value is intentionally only a monitoring starting point:

```text
_dmarc.labourtransparency.com TXT "v=DMARC1; p=none"
```

The DNS operator should confirm that the records are publicly resolvable. From
this directory, run:

```sh
./../../terraform/scripts/check-ses-dns.sh
```

The script is read-only and compares public DNS answers with the values in the
Terraform outputs. Run it again after DNS changes propagate; SES identity and
DKIM status can then be checked with:

```sh
terraform output ses_identity_arn
aws sesv2 get-email-identity --email-identity labourtransparency.com \
  --region ap-southeast-2
```

SES may initially remain in the sandbox, which limits delivery to verified
recipients. Production access is an AWS account/region request and is not
automated by Terraform. Checklist:

1. Apply this Terraform composition.
2. Give the DNS record outputs to the external DNS operator.
3. Confirm the DKIM, MAIL FROM, and DMARC records resolve publicly.
4. Wait for SES domain and DKIM verification.
5. Request SES production access in the configured AWS region.
6. Test sending through the Lambda runtime role.

No inbound SES resources, mailboxes, receipt rules, or inbound mail storage
are provisioned. `no-reply@labourtransparency.com` is a sending identity only;
it does not assert that a mailbox exists.
