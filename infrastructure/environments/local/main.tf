terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

provider "aws" {
  region                      = "ap-southeast-2"
  access_key                  = "test"
  secret_key                  = "testtest"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  endpoints {
    # Response objects live in persistent MinIO; the other AWS resources stay
    # in LocalStack.
    s3     = "http://localhost:19000"
    lambda = "http://localhost:14566"
    iam    = "http://localhost:14566"
    logs   = "http://localhost:14566"
  }
}

resource "random_id" "respondent_identity_key" { byte_length = 32 }
resource "random_id" "token_signing_key" { byte_length = 32 }

module "pulse_backend" {
  source = "../../terraform/modules/pulse-backend"

  environment          = "local"
  bucket_name          = "pulse-local-responses"
  lambda_function_name = "pulse-api-local"
  lambda_url_custom_id = "pulse-api-local"
  lambda_artifact_path = "../../../apps/pulse-api/artifacts/pulse-api.zip"
  # Set native_aot=true only with a tested provided.al2023/bootstrap artifact.
  lambda_runtime             = var.native_aot ? "provided.al2023" : "dotnet10"
  lambda_handler             = var.native_aot ? "bootstrap" : "Api"
  respondent_base_url        = "http://localhost:5173"
  email_provider             = "Local"
  ses_sender                 = "pulse-local@example.test"
  ses_configuration_set_name = null
  ses_identity_arn           = null
  cors_allow_origins         = ["http://localhost:5173"]
  # The Lambda runs in Docker on the pulse_default network. Use the
  # LocalStack service name rather than localhost, which points back to the
  # Lambda runtime container.
  s3_endpoint_url                        = "http://s3:9000"
  s3_access_key_id                       = "test"
  s3_secret_access_key                   = "testtest"
  manage_public_access_block             = false
  manage_bucket_encryption_and_lifecycle = false
  respondent_identity_key_value          = random_id.respondent_identity_key.b64_std
  token_signing_key_value                = random_id.token_signing_key.b64_std
}

# LocalStack returns the container's gateway port in Lambda Function URLs.
# Docker exposes that gateway on the host at port 14566.
output "function_url" {
  value = replace(module.pulse_backend.function_url, ":4566/", ":14566/")
}
output "bucket_name" { value = module.pulse_backend.bucket_name }
