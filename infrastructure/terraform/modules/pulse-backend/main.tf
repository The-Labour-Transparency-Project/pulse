terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
}

locals {
  response_prefix            = "responses/"
  lambda_execution_role_name = var.lambda_execution_role_name != null ? var.lambda_execution_role_name : aws_iam_role.lambda[0].name
  lambda_execution_role_arn  = var.lambda_execution_role_arn != null ? var.lambda_execution_role_arn : aws_iam_role.lambda[0].arn
}
