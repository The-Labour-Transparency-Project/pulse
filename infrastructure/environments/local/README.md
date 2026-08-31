# Local

Developer-only composition and configuration for running Pulse locally.
Use synthetic or explicitly approved development data.

This composition targets LocalStack at `http://localhost:14566`. It defaults to
the managed `dotnet10` Lambda runtime. Set `native_aot = true` only when
supplying a tested `provided.al2023`/`bootstrap` artifact.

The local Compose setup pins the community image
`localstack/localstack:4.14.0`, which provides the `.NET 10` Lambda runtime and
does not require a LocalStack license token.

The local API uses the `Local` email provider. Access links, including the
signed token, are written to the API logs for development. This applies both
when the API runs directly on `http://localhost:5100` and when the packaged
Lambda runs inside LocalStack; no SES identity or DNS setup is required.

Run `./go.sh apply` after starting LocalStack and MinIO. It provisions the
`pulse-local-responses` bucket in MinIO and applies the LocalStack Lambda
bridge (`http://s3:9000`) after Terraform, preserving the production secret
injection safeguard in the shared module.
