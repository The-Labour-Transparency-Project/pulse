
/*
  Configure the bucket used for storing the terraform state. It is
  important to note that this runs early on in the process and
  variable substitution is not permitted.

  Note: Once the bucket storage is created, enable versioning with:
        see ./scripts/make-aws-project.sh

    see
      - https://www.terraform.io/docs/backends/types/s3.html
*/
terraform {
  backend "s3" {
    bucket = "terraform-state-ltp-provisioner-factory"
    key    = "network/terraform.tfstate"
    region = "ap-southeast-2"

    /*
      This is the path to the shared credentials file. If this is not set and a profile is
      specified, ~/.aws/credentials will be used.

      (Optional) This is the AWS profile name as set in the shared credentials file. It can also be sourced from
      the AWS_PROFILE environment variable if AWS_SDK_LOAD_CONFIG is set to a truthy value, e.g. AWS_SDK_LOAD_CONFIG=1.

      @example

        $ export AWS_PROFILE=ltp-provisioner-factory
        $ export AWS_SDK_LOAD_CONFIG=1
        $ terraform plan
    */
  }
}

