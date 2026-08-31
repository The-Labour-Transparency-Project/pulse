variable "aws_region" { type = string }
variable "bucket_name" { type = string }
variable "lambda_artifact_path" { type = string }
variable "respondent_base_url" { type = string }
variable "ses_sender" {
  type        = string
  default     = "no-reply@labourtransparency.com"
  description = "Sending identity address; this does not imply a receiving mailbox exists."
}
variable "ses_configuration_set_name" {
  type        = string
  default     = "labour-transparency"
  description = "SES configuration set supplied to each production email request."
}
variable "cors_allow_origins" { type = list(string) }
variable "allowed_wave_ids" {
  type    = list(string)
  default = ["pulse-2026"]
}
variable "maximum_response_bytes" {
  type        = number
  default     = 1048576
  description = "Maximum serialized response size accepted by the API."
}
variable "respondent_identity_key" {
  type        = string
  sensitive   = true
  nullable    = false
  description = "Base64-encoded stable HMAC key used to derive respondent identities. Supply via TF_VAR_respondent_identity_key."
}
variable "token_signing_key" {
  type        = string
  sensitive   = true
  nullable    = false
  description = "Base64-encoded signing key used for respondent credentials. Supply via TF_VAR_token_signing_key."
}
