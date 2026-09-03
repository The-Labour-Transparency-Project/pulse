terraform {
  required_version = ">= 1.6.0"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 6.0" } }
}

provider "aws" {
  region = var.aws_region
  default_tags { tags = { Project = "labour-transparency-pulse", Environment = "production", ManagedBy = "terraform" } }
}

# Shared SES ownership boundary: this production state owns the account/region
# scoped domain identity and configuration set. Local state must not recreate
# these resources; it uses LocalStack/local email settings instead.
module "ses_email" {
  source = "../../terraform/modules/ses-email"

  aws_region             = var.aws_region
  domain                 = "labourtransparency.com"
  mail_from_domain       = "mail.labourtransparency.com"
  configuration_set_name = var.ses_configuration_set_name
}

module "pulse_backend" {
  source = "../../terraform/modules/pulse-backend"

  environment                   = "production"
  bucket_name                   = var.bucket_name
  lambda_function_name          = "pulse-api-production"
  lambda_artifact_path          = var.lambda_artifact_path
  lambda_runtime                = "dotnet10"
  lambda_handler                = "Api"
  respondent_base_url           = var.respondent_base_url
  email_provider                = "Aws"
  ses_sender                    = var.ses_sender
  ses_identity_arn              = module.ses_email.identity_arn
  ses_configuration_set_name    = var.ses_configuration_set_name
  cors_allow_origins            = var.cors_allow_origins
  allowed_wave_ids              = var.allowed_wave_ids
  maximum_response_bytes        = var.maximum_response_bytes
  respondent_identity_key_value = var.respondent_identity_key
  token_signing_key_value       = var.token_signing_key
}

output "function_url" { value = module.pulse_backend.function_url }
output "bucket_name" { value = module.pulse_backend.bucket_name }
output "ses_region" { value = var.aws_region }
output "ses_identity_arn" { value = module.ses_email.identity_arn }
output "ses_configuration_set_name" { value = module.ses_email.configuration_set_name }
output "ses_default_sender" { value = var.ses_sender }
output "ses_dkim_dns_records" { value = module.ses_email.dkim_dns_records }
output "ses_mail_from_dns_records" { value = module.ses_email.mail_from_dns_records }
output "ses_dmarc_dns_record" { value = module.ses_email.dmarc_dns_record }
