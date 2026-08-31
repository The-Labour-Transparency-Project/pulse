variable "environment" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "lambda_function_name" {
  type = string
}

variable "lambda_url_custom_id" {
  type        = string
  default     = null
  description = "Optional LocalStack _custom_id_ tag for a predictable Lambda Function URL subdomain."
}

variable "lambda_artifact_path" {
  type = string
}

variable "lambda_runtime" {
  type    = string
  default = "dotnet10"
}

variable "lambda_handler" {
  type    = string
  default = "Api"
}

variable "lambda_architecture" {
  type    = string
  default = "arm64"
}

variable "lambda_package_type" {
  type    = string
  default = "Zip"
}

variable "lambda_memory_size" {
  type    = number
  default = 512
}

variable "lambda_timeout" {
  type    = number
  default = 30
}

variable "lambda_execution_role_name" {
  type    = string
  default = null
}

variable "lambda_execution_role_arn" {
  type    = string
  default = null
}

variable "respondent_base_url" {
  type = string
}

variable "ses_sender" {
  type = string
}

variable "email_provider" {
  type        = string
  default     = "Aws"
  description = "Email provider selected by the API: Aws for production or Local for development."
  validation {
    condition     = contains(["Aws", "Local"], var.email_provider)
    error_message = "email_provider must be Aws or Local."
  }
}

variable "ses_identity_arn" {
  type        = string
  default     = null
  description = "Presence enables production SES send permissions. Null is suitable for LocalStack/local email."
}

variable "ses_configuration_set_name" {
  type        = string
  default     = null
  description = "Optional SES configuration set used for application email."
}

variable "allowed_wave_ids" {
  type    = list(string)
  default = ["pulse-2026"]
}

variable "maximum_response_bytes" {
  type    = number
  default = 1048576
}

variable "cors_allow_origins" {
  type    = list(string)
  default = []
}

variable "s3_endpoint_url" {
  type        = string
  default     = ""
  description = "Optional S3-compatible endpoint used by the Lambda. Leave empty for AWS S3."
}

variable "s3_access_key_id" {
  type      = string
  default   = null
  sensitive = true
}

variable "s3_secret_access_key" {
  type      = string
  default   = null
  sensitive = true
}

variable "manage_public_access_block" {
  type        = bool
  default     = true
  description = "Manage the AWS S3 public-access block. Disable for S3-compatible stores that do not implement the API."
}

variable "manage_bucket_encryption_and_lifecycle" {
  type        = bool
  default     = true
  description = "Manage AWS bucket encryption and lifecycle controls. Disable for limited S3-compatible stores."
}

variable "respondent_identity_key_value" {
  type      = string
  sensitive = true
  default   = null
}

variable "token_signing_key_value" {
  type      = string
  sensitive = true
  default   = null
}
