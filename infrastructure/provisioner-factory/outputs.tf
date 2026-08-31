output "provisioner_group_name" {
  value = module.provisioner_factory.provisioner_group_name
}

output "provisioner_policy_arn" {
  value = module.provisioner_factory.provisioner_policy_arn
}

output "provisioner_user_names" {
  value = module.provisioner_factory.provisioner_user_names
}

output "environment_terraform_state_bucket_names" {
  value = { for environment, provisioner in module.environment_provisioners : environment => provisioner.terraform_state_bucket_name }
}

output "environment_terraform_state_bucket_arns" {
  value = { for environment, provisioner in module.environment_provisioners : environment => provisioner.terraform_state_bucket_arn }
}
