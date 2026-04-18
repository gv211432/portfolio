#!/usr/bin/env bash
# ============================================================
#  CloudFront CDN Setup for gaurav.one
#  Edit the variables below before running.
# ============================================================
set -euo pipefail

# ─── CONFIG ──────────────────────────────────────────────────
RAILWAY_ORIGIN="REPLACE_WITH_YOUR_RAILWAY_APP.up.railway.app"
ROOT_DOMAIN="gaurav.one"
DISTRIBUTION_COMMENT="gaurav.one portfolio CDN"
AWS_REGION="us-east-1"   # ACM certs for CloudFront MUST be in us-east-1

# Subdomains to include as CloudFront aliases
ALIASES=(
  "gaurav.one"
  "www.gaurav.one"
  "ngo.gaurav.one"
  "opensource.gaurav.one"
  "vision.gaurav.one"
  "whitelabel.gaurav.one"
  "careers.gaurav.one"
  "casestudy.gaurav.one"
)

# Paths to invalidate on every deploy (HTML pages only)
# Static assets don't need invalidation since filenames are content-hashed
INVALIDATE_PATHS=(
  "/"
  "/contact"
)

# ─── STEP 1: Request ACM wildcard cert ───────────────────────
echo ">>> Requesting ACM certificate for ${ROOT_DOMAIN} and *.${ROOT_DOMAIN} ..."
CERT_ARN=$(aws acm request-certificate \
  --domain-name "${ROOT_DOMAIN}" \
  --subject-alternative-names "*.${ROOT_DOMAIN}" \
  --validation-method DNS \
  --region "${AWS_REGION}" \
  --query 'CertificateArn' \
  --output text)

echo "    Certificate ARN: ${CERT_ARN}"
echo "    ⚠  You must validate ownership via DNS before CloudFront creation."
echo "    Run: ./validate-cert.sh to add the DNS validation records."
echo ""

# ─── STEP 2: Create cache policies ───────────────────────────

# Policy A: Long-lived immutable static assets (/_next/static/*)
STATIC_CACHE_POLICY_ID=$(aws cloudfront create-cache-policy \
  --cache-policy-config "{
    \"Name\": \"gaurav-static-immutable\",
    \"Comment\": \"1yr cache for content-hashed Next.js static assets\",
    \"DefaultTTL\": 31536000,
    \"MaxTTL\": 31536000,
    \"MinTTL\": 31536000,
    \"ParametersInCacheKeyAndForwardedToOrigin\": {
      \"EnableAcceptEncodingGzip\": true,
      \"EnableAcceptEncodingBrotli\": true,
      \"HeadersConfig\": {\"HeaderBehavior\": \"none\"},
      \"CookiesConfig\": {\"CookieBehavior\": \"none\"},
      \"QueryStringsConfig\": {\"QueryStringBehavior\": \"none\"}
    }
  }" \
  --query 'CachePolicy.Id' --output text 2>/dev/null || \
  aws cloudfront list-cache-policies --type custom \
    --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='gaurav-static-immutable'].CachePolicy.Id" \
    --output text)

echo ">>> Static cache policy: ${STATIC_CACHE_POLICY_ID}"

# Policy B: 2h cache for HTML pages (Host header in cache key for subdomain support)
PAGE_CACHE_POLICY_ID=$(aws cloudfront create-cache-policy \
  --cache-policy-config "{
    \"Name\": \"gaurav-page-2h\",
    \"Comment\": \"2h cache for static HTML pages, keyed by Host header for subdomains\",
    \"DefaultTTL\": 7200,
    \"MaxTTL\": 14400,
    \"MinTTL\": 0,
    \"ParametersInCacheKeyAndForwardedToOrigin\": {
      \"EnableAcceptEncodingGzip\": true,
      \"EnableAcceptEncodingBrotli\": true,
      \"HeadersConfig\": {
        \"HeaderBehavior\": \"whitelist\",
        \"Headers\": {\"Quantity\": 1, \"Items\": [\"Host\"]}
      },
      \"CookiesConfig\": {\"CookieBehavior\": \"none\"},
      \"QueryStringsConfig\": {\"QueryStringBehavior\": \"none\"}
    }
  }" \
  --query 'CachePolicy.Id' --output text 2>/dev/null || \
  aws cloudfront list-cache-policies --type custom \
    --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='gaurav-page-2h'].CachePolicy.Id" \
    --output text)

echo ">>> Page cache policy: ${PAGE_CACHE_POLICY_ID}"

# Policy C: Media files 24h
MEDIA_CACHE_POLICY_ID=$(aws cloudfront create-cache-policy \
  --cache-policy-config "{
    \"Name\": \"gaurav-media-24h\",
    \"Comment\": \"24h cache for images and video assets\",
    \"DefaultTTL\": 86400,
    \"MaxTTL\": 604800,
    \"MinTTL\": 0,
    \"ParametersInCacheKeyAndForwardedToOrigin\": {
      \"EnableAcceptEncodingGzip\": false,
      \"EnableAcceptEncodingBrotli\": false,
      \"HeadersConfig\": {\"HeaderBehavior\": \"none\"},
      \"CookiesConfig\": {\"CookieBehavior\": \"none\"},
      \"QueryStringsConfig\": {\"QueryStringBehavior\": \"none\"}
    }
  }" \
  --query 'CachePolicy.Id' --output text 2>/dev/null || \
  aws cloudfront list-cache-policies --type custom \
    --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='gaurav-media-24h'].CachePolicy.Id" \
    --output text)

echo ">>> Media cache policy: ${MEDIA_CACHE_POLICY_ID}"

# ─── STEP 3: Create Origin Request Policy ────────────────────
# Forwards the Host header to Railway so Next.js middleware can detect subdomains
ORIGIN_REQUEST_POLICY_ID=$(aws cloudfront create-origin-request-policy \
  --origin-request-policy-config "{
    \"Name\": \"gaurav-forward-host\",
    \"Comment\": \"Forwards Host header + all cookies + all query strings to Railway origin\",
    \"HeadersConfig\": {
      \"HeaderBehavior\": \"whitelist\",
      \"Headers\": {\"Quantity\": 2, \"Items\": [\"Host\", \"X-Forwarded-Proto\"]}
    },
    \"CookiesConfig\": {\"CookieBehavior\": \"all\"},
    \"QueryStringsConfig\": {\"QueryStringBehavior\": \"all\"}
  }" \
  --query 'OriginRequestPolicy.Id' --output text 2>/dev/null || \
  aws cloudfront list-origin-request-policies --type custom \
    --query "OriginRequestPolicyList.Items[?OriginRequestPolicy.OriginRequestPolicyConfig.Name=='gaurav-forward-host'].OriginRequestPolicy.Id" \
    --output text)

echo ">>> Origin request policy: ${ORIGIN_REQUEST_POLICY_ID}"

# Managed policy IDs (AWS-provided, stable)
MANAGED_CACHING_DISABLED="4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
MANAGED_ALLVIEWER_EXCEPT_HOST_HEADER="b689b0a8-53d0-40ab-baf2-68738e2966ac"

# ─── STEP 4: Build the distribution config ───────────────────
ALIASES_JSON=$(printf '"%s",' "${ALIASES[@]}" | sed 's/,$//')
ALIAS_COUNT=${#ALIASES[@]}

cat > /tmp/cf-distribution.json <<DIST_EOF
{
  "Comment": "${DISTRIBUTION_COMMENT}",
  "Enabled": true,
  "HttpVersion": "http2and3",
  "PriceClass": "PriceClass_All",
  "Aliases": {
    "Quantity": ${ALIAS_COUNT},
    "Items": [${ALIASES_JSON}]
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "railway-origin",
        "DomainName": "${RAILWAY_ORIGIN}",
        "CustomOriginConfig": {
          "HTTPSPort": 443,
          "HTTPPort": 80,
          "OriginProtocolPolicy": "https-only",
          "OriginSSLProtocols": {"Quantity": 1, "Items": ["TLSv1.2"]}
        },
        "ConnectionAttempts": 3,
        "ConnectionTimeout": 10
      }
    ]
  },
  "CacheBehaviors": {
    "Quantity": 5,
    "Items": [
      {
        "PathPattern": "/_next/static/*",
        "TargetOriginId": "railway-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "${STATIC_CACHE_POLICY_ID}",
        "Compress": true,
        "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"],"CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}}
      },
      {
        "PathPattern": "/videos/hero/hls/*",
        "TargetOriginId": "railway-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "${MEDIA_CACHE_POLICY_ID}",
        "Compress": false,
        "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"],"CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}}
      },
      {
        "PathPattern": "/img/*",
        "TargetOriginId": "railway-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "${MEDIA_CACHE_POLICY_ID}",
        "Compress": true,
        "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"],"CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}}
      },
      {
        "PathPattern": "/videos/*",
        "TargetOriginId": "railway-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "${MEDIA_CACHE_POLICY_ID}",
        "Compress": false,
        "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"],"CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}}
      },
      {
        "PathPattern": "/contact",
        "TargetOriginId": "railway-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "${PAGE_CACHE_POLICY_ID}",
        "OriginRequestPolicyId": "${ORIGIN_REQUEST_POLICY_ID}",
        "Compress": true,
        "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"],"CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}}
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "railway-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "${MANAGED_CACHING_DISABLED}",
    "OriginRequestPolicyId": "${ORIGIN_REQUEST_POLICY_ID}",
    "Compress": true,
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
      "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}
    }
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "REPLACE_WITH_CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Logging": {"Enabled": false, "IncludeCookies": false, "Bucket": "", "Prefix": ""}
}
DIST_EOF

echo ""
echo ">>> Distribution config written to /tmp/cf-distribution.json"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Validate the ACM cert DNS records (run ./validate-cert.sh ${CERT_ARN})"
echo "2. Wait for cert Status = ISSUED (check: aws acm describe-certificate --certificate-arn ${CERT_ARN} --region us-east-1)"
echo "3. Update /tmp/cf-distribution.json: replace REPLACE_WITH_CERT_ARN with ${CERT_ARN}"
echo "4. Run: ./create-distribution.sh"
echo ""
echo "Cert ARN saved: ${CERT_ARN}"
echo "${CERT_ARN}" > /tmp/gaurav-cert-arn.txt
