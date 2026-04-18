#!/usr/bin/env bash
# Disables and deletes the old S3-backed CloudFront distribution (EVG0UKLGPAHJ0).
set -euo pipefail

OLD_DIST_ID="EVG0UKLGPAHJ0"

echo ">>> Fetching current config for ${OLD_DIST_ID}..."
CONFIG_JSON=$(aws cloudfront get-distribution-config --id "${OLD_DIST_ID}" --output json)
ETAG=$(echo "${CONFIG_JSON}" | python3 -c "import json,sys; print(json.load(sys.stdin)['ETag'])")
CONFIG=$(echo "${CONFIG_JSON}" | python3 -c "import json,sys; d=json.load(sys.stdin); d['DistributionConfig']['Enabled']=False; print(json.dumps(d['DistributionConfig']))")

echo ">>> Disabling distribution (required before delete)..."
UPDATE_OUT=$(aws cloudfront update-distribution \
  --id "${OLD_DIST_ID}" \
  --if-match "${ETAG}" \
  --distribution-config "${CONFIG}" \
  --output json)

NEW_ETAG=$(echo "${UPDATE_OUT}" | python3 -c "import json,sys; print(json.load(sys.stdin)['ETag'])")
echo "    Disabled. New ETag: ${NEW_ETAG}"

echo ">>> Waiting for distribution to reach Deployed state (may take ~15 min)..."
aws cloudfront wait distribution-deployed --id "${OLD_DIST_ID}"

echo ">>> Deleting distribution..."
aws cloudfront delete-distribution --id "${OLD_DIST_ID}" --if-match "${NEW_ETAG}"

echo ">>> Old distribution ${OLD_DIST_ID} deleted."
