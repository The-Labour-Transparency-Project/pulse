resource "aws_s3_bucket" "responses" {
  bucket = var.bucket_name
  tags   = { Environment = var.environment, Purpose = "immutable-survey-responses" }

  lifecycle {
    # Response data is production research data. A replacement or destroy
    # must never remove the bucket implicitly during an infrastructure apply.
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "responses" {
  count                   = var.manage_public_access_block ? 1 : 0
  bucket                  = aws_s3_bucket.responses.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "responses" {
  bucket = aws_s3_bucket.responses.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "responses" {
  count  = var.manage_bucket_encryption_and_lifecycle ? 1 : 0
  bucket = aws_s3_bucket.responses.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "responses" {
  count  = var.manage_bucket_encryption_and_lifecycle ? 1 : 0
  bucket = aws_s3_bucket.responses.id
  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
