# Provisioner Factory

This is the one-time IAM bootstrap composition. It is run by an approved AWS
administrator and creates the project provisioner users used by TeamCity.

```text
AWS administrator
      │
      ▼
Provisioner Factory
      │ creates
      ▼
Provisioners group + project users
      │
      ▼
Environment Terraform
```

It creates the `Provisioners` group, one or more project-scoped IAM users, the
managed policy attached to that group, and a versioned Terraform state bucket
for every entry in `environment_provisioners`. It does not create access keys;
create those through an approved credential workflow and store them only in
TeamCity secure parameters.

This matches the existing bootstrap workflow. The factory does not create
Lambda functions, SES identities, application data buckets, or other
application infrastructure. The production provisioner policy may grant the
production environment Terraform the reviewed SES management actions needed
to create the shared identity and configuration set.

## Bootstrap

Use an administrator role, IAM Identity Center session, or another approved
administrator-equivalent principal. Do not use AWS root access keys.

The supplied `provisioner_policy_json` is the explicit permission grant for
IAM, `iam:PassRole`, and the Terraform state bucket. S3 application storage,
CloudWatch Logs, SES, and Lambda are attached separately through the AWS
managed policy ARNs in `provisioner_managed_policy_arns`. Review both sets of
permissions as carefully as any production IAM policy. Keep explicit IAM
permissions scoped to the production execution role; do not grant `iam:*` or
unrestricted administration.

After applying this composition:

1. Create an access key for each project user using the approved AWS or CI
   credential process.
2. Store the access key ID and secret as protected TeamCity parameters.
3. Configure the production environment Terraform to use those credentials
   and the factory output for the production state bucket.

The factory state contains IAM definitions and must use protected, encrypted,
versioned remote state. This composition intentionally does not create its own
backend because that would introduce a bootstrap dependency.
