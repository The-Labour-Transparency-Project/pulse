variable "aws_region" {
  type        = string
  description = "AWS region containing the shared SES identity and configuration set."
}

variable "domain" {
  type        = string
  description = "Verified SES sending domain. This module is intended to be instantiated once per AWS account and region."
}

variable "mail_from_domain" {
  type        = string
  description = "Custom MAIL FROM subdomain for the SES identity."
}

variable "configuration_set_name" {
  type        = string
  description = "Stable SES configuration set name used by application email."
}
