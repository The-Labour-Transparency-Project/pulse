output "identity_arn" {
  description = "SES domain identity ARN for scoping application send permissions."
  value       = aws_sesv2_email_identity.domain.arn
}

output "identity_name" {
  description = "SES domain identity name."
  value       = aws_sesv2_email_identity.domain.email_identity
}

output "configuration_set_name" {
  description = "SES configuration set name for application email."
  value       = aws_sesv2_configuration_set.application.configuration_set_name
}

output "dkim_dns_records" {
  description = "DKIM CNAME records to create manually in external DNS."
  value = [
    for token in aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens : {
      name  = "${token}._domainkey.${var.domain}"
      type  = "CNAME"
      value = "${token}.dkim.amazonses.com"
    }
  ]
}

output "mail_from_dns_records" {
  description = "Custom MAIL FROM MX and SPF records to create manually in external DNS."
  value = [
    {
      name  = var.mail_from_domain
      type  = "MX"
      value = local.mail_from_mx_value
    },
    {
      name  = var.mail_from_domain
      type  = "TXT"
      value = local.mail_from_spf_value
    }
  ]
}

output "dmarc_dns_record" {
  description = "Suggested initial DMARC record to create manually in external DNS."
  value = {
    name  = "_dmarc.${var.domain}"
    type  = "TXT"
    value = "v=DMARC1; p=none"
  }
}
