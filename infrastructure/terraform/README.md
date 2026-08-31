# Terraform modules

This directory contains reusable Terraform modules only. Deployable Terraform
compositions live directly under `infrastructure/`:

- `infrastructure/environments/local`
- `infrastructure/environments/production`
- `infrastructure/provisioner-factory`
- `infrastructure/environment-provisioners/production`

The IAM compositions are deliberately separate from the application
environment compositions:

```text
provisioner-factory
    -> environment-provisioners/production (Terraform state)
        -> environments/production (application infrastructure)
            -> terraform/modules/pulse-backend
```

Keep state remote and protected, review plans, and pass environment-specific
values from each root composition rather than embedding secrets in modules.

The production environment is the single owner of the shared SES sending
identity for `labourtransparency.com` in its configured AWS region. The local
environment deliberately does not create SES resources because local uses the
`Local` email provider. Production Terraform outputs explicit DKIM, custom MAIL FROM, and
initial DMARC DNS records for the external DNS operator. SES sandbox exit must
be requested manually in AWS.

Build the managed .NET 10 Lambda artifact before applying either environment.
The script uses the repository root, targets the API's actual `net10.0`
framework, and writes the path consumed by both Terraform environments:

```sh
dotnet tool install -g Amazon.Lambda.Tools # once per machine/agent
infrastructure/scripts/package-lambda.sh
terraform -chdir=infrastructure/environments/local init
terraform -chdir=infrastructure/environments/local apply
```

For production, run the same packaging command in the release/TeamCity step
before applying `infrastructure/environments/production`. The production
`lambda_artifact_path` points to the same repository-relative artifact. The
script currently rejects `native-aot`: the API uses the managed
`Amazon.Lambda.AspNetCoreServer.Hosting` integration and does not yet contain
the tested `bootstrap` executable required by the `provided.al2023` runtime.

For production, TeamCity should export its Password-type parameters as
`TF_VAR_respondent_identity_key` and `TF_VAR_token_signing_key` before running
Terraform. These values are passed into the Lambda environment and are stored
in Terraform state, so the state backend and plan artifacts must be protected.
Both values are base64-encoded and the respondent identity key must remain
stable for the lifetime of the survey. The legacy
`inject-lambda-environment.sh` script remains available for deployments that
deliberately keep runtime secrets outside Terraform state.

The default package is the managed `dotnet10` runtime. Native AOT is a
separate artifact/runtime mode: use a Linux `arm64` executable with a
`bootstrap` entrypoint and set the local `native_aot` variable to `true` only
after the application has an AOT-compatible Lambda bootstrap. That mode uses
`provided.al2023`; it is not silently selected because the current ASP.NET
hosting path is verified first against the managed runtime. LocalStack may
need a current Lambda-capable image for either runtime mode.
