provider "aws" {
  region = var.aws_region
  default_tags {
    tags = merge(var.tags, {
      Project   = "labour-transparency-pulse"
      ManagedBy = "provisioner-factory"
    })
  }
}
