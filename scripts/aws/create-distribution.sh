#!/usr/bin/env bash
# Creates the CloudFront distribution once wildcard cert is ISSUED.
# Usage: ./create-distribution.sh <wildcard-cert-arn>
set -euo pipefail

WILDCARD_CERT_ARN="${1:-}"
if [[ -z "${WILDCARD_CERT_ARN}" ]]; then
  echo "Usage: $0 <wildcard-cert-arn>"
  echo ""
  echo "Get the ARN from:"
  echo "  aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?Status==\`ISSUED\`]'"
  exit 1
fi

DIST_CONFIG_FILE="/tmp/gaurav-cf-distribution.json"

# Inject the cert ARN
sed -i "s|WILDCARD_CERT_ARN_HERE|${WILDCARD_CERT_ARN}|g" "${DIST_CONFIG_FILE}"

echo ">>> Creating CloudFront distribution..."
DIST_OUTPUT=$(aws cloudfront create-distribution \
  --distribution-config "file://${DIST_CONFIG_FILE}" \
  --output json)

DIST_ID=$(echo "${DIST_OUTPUT}" | python3 -c "import json,sys; print(json.load(sys.stdin)['Distribution']['Id'])")
DIST_DOMAIN=$(echo "${DIST_OUTPUT}" | python3 -c "import json,sys; print(json.load(sys.stdin)['Distribution']['DomainName'])")

echo ""
echo "=== Distribution Created ==="
echo "ID:         ${DIST_ID}"
echo "Domain:     ${DIST_DOMAIN}"
echo "Status:     InProgress (takes ~15-20 min to deploy)"
echo ""
echo "=== Route53 changes needed (tell your admin) ==="
echo ""
echo "Change these records from CNAME to ALIAS pointing to: ${DIST_DOMAIN}"
echo "CloudFront hosted zone for ALIAS: Z2FDTNDATAQYW2"
echo ""
echo "  gaurav.one        A   ALIAS → ${DIST_DOMAIN}"
echo "  www.gaurav.one    A   ALIAS → ${DIST_DOMAIN}"
echo "  ngo.gaurav.one    A   ALIAS → ${DIST_DOMAIN}"
echo "  opensource.gaurav.one A ALIAS → ${DIST_DOMAIN}"
echo "  vision.gaurav.one A   ALIAS → ${DIST_DOMAIN}"
echo "  whitelabel.gaurav.one A ALIAS → ${DIST_DOMAIN}"
echo "  careers.gaurav.one A  ALIAS → ${DIST_DOMAIN}"
echo "  casestudy.gaurav.one A ALIAS → ${DIST_DOMAIN}"
echo ""
echo "=== GitHub Actions Secrets needed ==="
echo "  AWS_ACCESS_KEY_ID     = (your CLI user key)"
echo "  AWS_SECRET_ACCESS_KEY = (your CLI user secret)"
echo "  CF_DISTRIBUTION_ID    = ${DIST_ID}"
echo ""
echo "Distribution ID: ${DIST_ID}" > /tmp/gaurav-dist-id.txt
echo "Check deploy status:"
echo "  aws cloudfront get-distribution --id ${DIST_ID} --query Distribution.Status"
