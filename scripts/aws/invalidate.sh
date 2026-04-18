#!/usr/bin/env bash
# Invalidates CloudFront HTML page cache on deploy.
# Safe to run multiple times — static assets are NOT invalidated
# since their filenames are content-hashed.
set -euo pipefail

DIST_ID="${CF_DISTRIBUTION_ID:-E2RQCLGUZRUS6B}"

if [[ -z "${DIST_ID}" ]]; then
  echo "Set CF_DISTRIBUTION_ID env var or run create-distribution.sh first."
  exit 1
fi

echo ">>> Invalidating CloudFront cache for distribution ${DIST_ID}..."

aws cloudfront create-invalidation \
  --distribution-id "${DIST_ID}" \
  --paths \
    "/" \
    "/contact" \
  --output json | python3 -c "
import json, sys
r = json.load(sys.stdin)
print(f\"Invalidation ID: {r['Invalidation']['Id']}\")
print(f\"Status: {r['Invalidation']['Status']}\")
"

echo ""
echo ">>> Cache invalidated. Pages will reflect new content within ~60 seconds."
echo ">>> (Next.js static assets stay cached — content-hashed, no invalidation needed.)"
