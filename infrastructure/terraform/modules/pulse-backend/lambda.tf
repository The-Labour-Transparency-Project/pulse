resource "aws_lambda_function" "api" {
  function_name    = var.lambda_function_name
  role             = local.lambda_execution_role_arn
  filename         = var.lambda_artifact_path
  source_code_hash = filebase64sha256(var.lambda_artifact_path)
  handler          = var.lambda_handler
  runtime          = var.lambda_runtime
  architectures    = [var.lambda_architecture]
  package_type     = var.lambda_package_type
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  publish          = true

  environment {
    variables = merge({
      S3BucketName         = aws_s3_bucket.responses.bucket
      RespondentBaseUrl    = var.respondent_base_url
      EmailProvider        = var.email_provider
      SesSender            = var.ses_sender
      AllowedWaveIds       = join(",", var.allowed_wave_ids)
      MaximumResponseBytes = tostring(var.maximum_response_bytes)
      AWSServiceUrl        = var.s3_endpoint_url
    }, var.ses_configuration_set_name == null ? {} : { SesConfigurationSetName = var.ses_configuration_set_name }, var.respondent_identity_key_value == null ? {} : { RespondentIdentityKey = var.respondent_identity_key_value }, var.token_signing_key_value == null ? {} : { TokenSigningKey = var.token_signing_key_value }, var.s3_access_key_id == null ? {} : { AWS_ACCESS_KEY_ID = var.s3_access_key_id }, var.s3_secret_access_key == null ? {} : { AWS_SECRET_ACCESS_KEY = var.s3_secret_access_key })
  }

  depends_on = [aws_cloudwatch_log_group.lambda, aws_iam_role_policy.lambda_access, aws_iam_role_policy.lambda_logs]
  tags = merge(
    { Environment = var.environment },
    var.lambda_url_custom_id == null ? {} : { _custom_id_ = var.lambda_url_custom_id }
  )
}
