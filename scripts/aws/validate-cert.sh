#!/usr/bin/env bash
# Adds ACM DNS validation CNAME records to Route53 automatically.
# Usage: ./validate-cert.sh <cert-arn>
set -euo pipefail

CERT_ARN="${1:-$(cat /tmp/gaurav-cert-arn.txt 2>/dev/null || echo '')}"
ROOT_DOMAIN="gaurav.one"

if [[ -z "${CERT_ARN}" ]]; then
  echo "Usage: $0 <certificate-arn>"
  exit 1
fi

echo ">>> Fetching DNS validation records for ${CERT_ARN} ..."
sleep 5  # give AWS a moment to populate validation records

VALIDATIONS=$(aws acm describe-certificate \
  --certificate-arn "${CERT_ARN}" \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord' \
  --output json)

echo "Validation records: ${VALIDATIONS}"

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='${ROOT_DOMAIN}.'].Id" \
  --output text | sed 's|/hostedzone/||')

echo ">>> Hosted zone ID: ${HOSTED_ZONE_ID}"

CHANGES=$(echo "${VALIDATIONS}" | python3 -c "
import json, sys
records = json.load(sys.stdin)
changes = []
for r in records:
    if r:
        changes.append({
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': r['Name'],
                'Type': r['Type'],
                'TTL': 300,
                'ResourceRecords': [{'Value': r['Value']}]
            }
        })
print(json.dumps({'Changes': changes}))
")

aws route53 change-resource-record-sets \
  --hosted-zone-id "${HOSTED_ZONE_ID}" \
  --change-batch "${CHANGES}"

echo ""
echo ">>> DNS validation records added. Certificate will be ISSUED in ~5 minutes."
echo ">>> Check status: aws acm describe-certificate --certificate-arn ${CERT_ARN} --region us-east-1 --query Certificate.Status"
