#!/usr/bin/env bash
set -euo pipefail

REGION=us-east-1
ACCOUNT=598888049190
BUCKET=gaurav.one
FN=ses-inbound
ROLE=ses-inbound-role
WEBHOOK_URL=https://www.gaurav.one/api/mail/inbound
WEBHOOK_API_KEY=3ssdfh2389y2u3h4jk5h2kei788a7s6d5f4g3h2j1k0l9m8n7o6p5q4r3s2t1u0v

cd "$(dirname "$0")/../ses-inbound"

# 1. Build zip
bun install
rm -f fn.zip
zip -qr fn.zip index.mjs package.json node_modules

# 2. Execution role (create or skip)
cat > /tmp/trust.json <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
cat > /tmp/role-policy.json <<EOF
{"Version":"2012-10-17","Statement":[
 {"Effect":"Allow","Action":["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],"Resource":"*"},
 {"Effect":"Allow","Action":["s3:GetObject"],"Resource":"arn:aws:s3:::$BUCKET/inbound/*"},
 {"Effect":"Allow","Action":["s3:PutObject"],"Resource":"arn:aws:s3:::$BUCKET/attachments/*"}
]}
EOF
if ! aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  aws iam create-role --role-name "$ROLE" --assume-role-policy-document file:///tmp/trust.json
  sleep 10
fi
aws iam put-role-policy --role-name "$ROLE" --policy-name ses-inbound-inline --policy-document file:///tmp/role-policy.json

# 3. Lambda (create or update code + env)
if aws lambda get-function --function-name "$FN" --region "$REGION" >/dev/null 2>&1; then
  aws lambda update-function-code --function-name "$FN" --region "$REGION" --zip-file fileb://fn.zip >/dev/null
  aws lambda wait function-updated --function-name "$FN" --region "$REGION"
  aws lambda update-function-configuration --function-name "$FN" --region "$REGION" \
    --timeout 30 --memory-size 512 \
    --environment "Variables={WEBHOOK_URL=$WEBHOOK_URL,WEBHOOK_API_KEY=$WEBHOOK_API_KEY,BUCKET=$BUCKET,ATTACHMENT_PREFIX=attachments/}" >/dev/null
else
  aws lambda create-function \
    --function-name "$FN" \
    --runtime nodejs20.x \
    --handler index.handler \
    --zip-file fileb://fn.zip \
    --role "arn:aws:iam::$ACCOUNT:role/$ROLE" \
    --timeout 30 --memory-size 512 \
    --region "$REGION" \
    --environment "Variables={WEBHOOK_URL=$WEBHOOK_URL,WEBHOOK_API_KEY=$WEBHOOK_API_KEY,BUCKET=$BUCKET,ATTACHMENT_PREFIX=attachments/}"
fi

# 4. Allow S3 → Lambda invoke (ignore if already exists)
aws lambda add-permission --function-name "$FN" --region "$REGION" \
  --statement-id s3invoke --action lambda:InvokeFunction \
  --principal s3.amazonaws.com --source-arn "arn:aws:s3:::$BUCKET" 2>/dev/null || true

# 5. S3 notification (put = replace, already idempotent)
aws s3api put-bucket-notification-configuration --bucket "$BUCKET" \
  --notification-configuration "{\"LambdaFunctionConfigurations\":[{\"LambdaFunctionArn\":\"arn:aws:lambda:$REGION:$ACCOUNT:function:$FN\",\"Events\":[\"s3:ObjectCreated:*\"],\"Filter\":{\"Key\":{\"FilterRules\":[{\"Name\":\"prefix\",\"Value\":\"inbound/\"}]}}}]}"

# 6. Bucket policy (put = replace)
cat > /tmp/bucket-policy.json <<EOF
{"Version":"2012-10-17","Statement":[{"Sid":"AllowSESPut","Effect":"Allow","Principal":{"Service":"ses.amazonaws.com"},"Action":"s3:PutObject","Resource":"arn:aws:s3:::$BUCKET/inbound/*","Condition":{"StringEquals":{"aws:Referer":"$ACCOUNT"}}}]}
EOF
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/bucket-policy.json

# 7. SES domain + DKIM (both idempotent)
aws ses verify-domain-identity --domain mail.gaurav.one --region "$REGION"
aws ses verify-domain-dkim    --domain mail.gaurav.one --region "$REGION"

# 8. SES receipt rule set + rule
aws ses create-receipt-rule-set --rule-set-name default-inbound --region "$REGION" 2>/dev/null || true
if aws ses describe-receipt-rule --rule-set-name default-inbound --rule-name inbound-to-s3 --region "$REGION" >/dev/null 2>&1; then
  aws ses update-receipt-rule --rule-set-name default-inbound --region "$REGION" \
    --rule "{\"Name\":\"inbound-to-s3\",\"Enabled\":true,\"ScanEnabled\":true,\"TlsPolicy\":\"Optional\",\"Recipients\":[\"mail.gaurav.one\"],\"Actions\":[{\"S3Action\":{\"BucketName\":\"$BUCKET\",\"ObjectKeyPrefix\":\"inbound/\"}}]}"
else
  aws ses create-receipt-rule --rule-set-name default-inbound --region "$REGION" \
    --rule "{\"Name\":\"inbound-to-s3\",\"Enabled\":true,\"ScanEnabled\":true,\"TlsPolicy\":\"Optional\",\"Recipients\":[\"mail.gaurav.one\"],\"Actions\":[{\"S3Action\":{\"BucketName\":\"$BUCKET\",\"ObjectKeyPrefix\":\"inbound/\"}}]}"
fi
aws ses set-active-receipt-rule-set --rule-set-name default-inbound --region "$REGION"

echo "✓ Deploy complete. Tail logs with:"
echo "  aws logs tail /aws/lambda/$FN --follow --region $REGION"
