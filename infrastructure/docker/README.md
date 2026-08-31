# Docker

Local development and service container definitions. Containers should make
the API, supporting services, and repeatable data-processing jobs easy to run
without becoming the source of truth for cloud deployment.
The default Docker Compose profile starts LocalStack with the AWS services used
by the local Terraform composition: S3, Lambda, IAM, CloudWatch Logs, Secrets
Manager, SES, and STS. Pulse deliberately uses host ports `14566` and
`14510-14559` for LocalStack, plus `19000` and `19090` for MinIO, to avoid
collisions with common development stacks.

The Compose project is explicitly named `pulse`, so Docker Desktop and its
container, network, and volume resources are not named after the `docker`
directory.

The pinned community image is `localstack/localstack:4.14.0` and includes the
.NET 10 Lambda runtime. It does not require a LocalStack auth token.

```sh
docker compose -f infrastructure/docker/compose.yaml up -d localstack s3
# terraform -chdir=infrastructure/environments/local init
terraform -chdir=infrastructure/environments/local apply
```

The `pulse-api` service remains a placeholder; the Lambda artifact is deployed
through Terraform so local execution follows the Function URL path.

MinIO is the local response store and persists objects in the `pulse_minio`
Docker volume. Its API is available at `http://localhost:19000` and its
console at `http://localhost:19090` (default credentials: `test`/`testtest`).
The local Terraform S3 endpoint is MinIO, while Lambda, IAM, logs, and the
Function URL remain in LocalStack.

LocalStack applies a global CORS check before routing Lambda Function URLs.
`PULSE_RESPONDENT_ORIGIN` defaults to `http://localhost:5173` in Compose. Set it
when the Vite dev server is running on another origin, then recreate the
LocalStack container before testing the Function URL.
