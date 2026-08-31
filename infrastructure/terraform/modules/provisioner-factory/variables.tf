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
  description = "Reviewed permissions granted to all provisioner users in the group."

  validation {
    condition     = can(jsondecode(var.provisioner_policy_json))
    error_message = "provisioner_policy_json must be valid JSON."
  }
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
  description = "Project/environment provisioner users to create. Access keys are intentionally not created here."
  default     = {}
}

variable "tags" {
  type    = map(string)
  default = {}
}
