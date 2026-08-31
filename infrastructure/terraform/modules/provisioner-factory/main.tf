resource "aws_iam_group" "provisioners" {
  name = var.provisioner_group_name
  path = var.provisioner_group_path
}

resource "aws_iam_policy" "provisioners" {
  name        = var.provisioner_policy_name
  path        = var.provisioner_policy_path
  description = "Terraform permissions granted to project provisioner users."
  policy      = var.provisioner_policy_json
  tags        = var.tags
}

resource "aws_iam_group_policy_attachment" "provisioners" {
  group      = aws_iam_group.provisioners.name
  policy_arn = aws_iam_policy.provisioners.arn
}

resource "aws_iam_group_policy_attachment" "managed" {
  for_each   = var.provisioner_managed_policy_arns
  group      = aws_iam_group.provisioners.name
  policy_arn = each.value
}

resource "aws_iam_user" "provisioners" {
  for_each = var.provisioner_users

  name          = each.value.user_name
  path          = var.provisioner_user_path
  force_destroy = false
  tags          = merge(var.tags, { Environment = each.key, Component = "terraform-provisioner" })
}

resource "aws_iam_group_membership" "provisioners" {
  name  = "${aws_iam_group.provisioners.name}-membership"
  group = aws_iam_group.provisioners.name
  users = [for user in aws_iam_user.provisioners : user.name]
}
