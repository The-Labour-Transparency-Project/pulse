variable "environment" {
  type = string
}

variable "terraform_state_bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name for this environment's Terraform state."
}

variable "tags" {
  type    = map(string)
  default = {}
}
