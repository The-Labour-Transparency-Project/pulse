variable "aws_region" {
  type = string
}

variable "provisioner_group_name" {
  type    = string
  default = "Provisioners"
}

variable "provisioner_group_path" {
  type    = string
  default = "/provisioners/"
}

variable "provisioner_user_path" {
  type    = string
  default = "/provisioners/"
}

variable "provisioner_policy_name" {
  type    = string
  default = "ProvisionerPermissions"
}

variable "provisioner_policy_path" {
  type    = string
  default = "/provisioners/"
}

variable "provisioner_policy_json" {
  type        = string
  description = "Reviewed permissions granted to the provisioner group."
}

variable "provisioner_managed_policy_arns" {
  type        = set(string)
  description = "AWS-managed policy ARNs attached to the provisioner group."
  default     = []
}

variable "provisioner_users" {
  type = map(object({
    user_name = string
  }))
  default = {}
}

variable "environment_provisioners" {
  type = map(object({
    terraform_state_bucket_name = string
    tags                        = optional(map(string), {})
  }))
  description = "Environment Terraform state buckets created by this factory."
  default     = {}
}

variable "tags" {
  type    = map(string)
  default = {}
}
