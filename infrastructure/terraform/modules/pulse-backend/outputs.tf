output "bucket_name" { value = aws_s3_bucket.responses.bucket }
output "bucket_arn" { value = aws_s3_bucket.responses.arn }
output "function_name" { value = aws_lambda_function.api.function_name }
output "function_url" { value = aws_lambda_function_url.api.function_url }
