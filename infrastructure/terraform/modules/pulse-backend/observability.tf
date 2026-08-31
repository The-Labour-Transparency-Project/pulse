resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.environment == "production" ? 30 : 7
  tags              = { Environment = var.environment }
}
