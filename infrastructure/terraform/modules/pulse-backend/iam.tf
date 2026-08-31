data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  count              = var.lambda_execution_role_arn == null ? 1 : 0
  name               = "${var.lambda_function_name}-execution"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = { Environment = var.environment }
}

data "aws_iam_policy_document" "lambda_access" {
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.responses.arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["${local.response_prefix}*"]
    }
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.responses.arn}/${local.response_prefix}*"]
  }
  dynamic "statement" {
    for_each = var.ses_identity_arn == null ? [] : [var.ses_identity_arn]
    content {
      effect  = "Allow"
      actions = ["ses:SendEmail", "ses:SendRawEmail"]
      # SES SendEmail authorization can evaluate the identity resource using
      # a recipient address. Restrict the actual sender with the condition
      # below instead of scoping Resource to the sender identity ARN.
      resources = ["*"]
      condition {
        test     = "StringEquals"
        variable = "ses:FromAddress"
        values   = [var.ses_sender]
      }
    }
  }
}

data "aws_iam_policy_document" "lambda_logs" {
  statement {
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:${data.aws_partition.current.partition}:logs:*:*:*"]
  }
}

data "aws_partition" "current" {}

resource "aws_iam_role_policy" "lambda_access" {
  name   = "${var.lambda_function_name}-access"
  role   = local.lambda_execution_role_name
  policy = data.aws_iam_policy_document.lambda_access.json
}

resource "aws_iam_role_policy" "lambda_logs" {
  name   = "${var.lambda_function_name}-logs"
  role   = local.lambda_execution_role_name
  policy = data.aws_iam_policy_document.lambda_logs.json
}
