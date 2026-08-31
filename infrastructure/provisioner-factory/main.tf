module "provisioner_factory" {
  source = "../terraform/modules/provisioner-factory"

  provisioner_group_name  = var.provisioner_group_name
  provisioner_group_path  = var.provisioner_group_path
  provisioner_user_path   = var.provisioner_user_path
  provisioner_policy_name = var.provisioner_policy_name
  provisioner_policy_path = var.provisioner_policy_path
  provisioner_policy_json = var.provisioner_policy_json
  provisioner_managed_policy_arns = var.provisioner_managed_policy_arns
  provisioner_users       = var.provisioner_users
  tags                    = var.tags
}

module "environment_provisioners" {
  for_each = var.environment_provisioners
  source   = "../terraform/modules/environment-provisioners"

  environment                 = each.key
  terraform_state_bucket_name = each.value.terraform_state_bucket_name
  tags                        = merge(var.tags, each.value.tags)
}
