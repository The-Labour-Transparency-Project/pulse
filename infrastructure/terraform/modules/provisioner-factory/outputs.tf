output "provisioner_group_name" {
  value = aws_iam_group.provisioners.name
}

output "provisioner_policy_arn" {
  value = aws_iam_policy.provisioners.arn
}

output "provisioner_user_names" {
  value = { for key, user in aws_iam_user.provisioners : key => user.name }
}
