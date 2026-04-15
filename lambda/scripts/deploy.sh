cd ../ses-inbound

# 1. Build zip
bun install
zip -qr fn.zip index.mjs package.json node_modules

# 2. Execution role
cat > /tmp/trust.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
cat > /tmp/role-policy.json <<'EOF'
{"Version":"2012-10-17","Statement":[
 {"Effect":"Allow","Action":["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],"Resource":"*"},
 {"Effect":"Allow","Action":["s3:GetObject"],"Resource":"arn:aws:s3:::gaurav.one/inbound/*"},
 {"Effect":"Allow","Action":["s3:PutObject"],"Resource":"arn:aws:s3:::gaurav.one/attachments/*"}
]}
EOF
aws iam create-role --role-name ses-inbound-role --assume-role-policy-document file:///tmp/trust.json
aws iam put-role-policy --role-name ses-inbound-role --policy-name ses-inbound-inline --policy-document file:///tmp/role-policy.json
sleep 10

# 3. Create Lambda (us-east-1)
aws lambda create-function \
  --function-name ses-inbound \
  --runtime nodejs20.x \
  --handler index.handler \
  --zip-file fileb://fn.zip \
  --role arn:aws:iam::598888049190:role/ses-inbound-role \
  --timeout 30 --memory-size 512 \
  --region us-east-1 \
  --environment 'Variables={WEBHOOK_URL=https://gaurav.one/api/mail/inbound,WEBHOOK_API_KEY=3ssdfh2389y2u3h4jk5h2kei788a7s6d5f4g3h2j1k0l9m8n7o6p5q4r3s2t1u0v,BUCKET=gaurav.one,ATTACHMENT_PREFIX=attachments/}'

# 4. Allow S3 → Lambda invoke
aws lambda add-permission --function-name ses-inbound \
  --statement-id s3invoke --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::gaurav.one \
  --region us-east-1

# 5. Wire S3 ObjectCreated (inbound/) → Lambda
aws s3api put-bucket-notification-configuration --bucket gaurav.one \
  --notification-configuration '{"LambdaFunctionConfigurations":[{"LambdaFunctionArn":"arn:aws:lambda:us-east-1:598888049190:function:ses-inbound","Events":["s3:ObjectCreated:*"],"Filter":{"Key":{"FilterRules":[{"Name":"prefix","Value":"inbound/"}]}}}]}'

# 6. Bucket policy so SES can PutObject into inbound/
cat > /tmp/bucket-policy.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Sid":"AllowSESPut","Effect":"Allow","Principal":{"Service":"ses.amazonaws.com"},"Action":"s3:PutObject","Resource":"arn:aws:s3:::gaurav.one/inbound/*","Condition":{"StringEquals":{"aws:Referer":"598888049190"}}}]}
EOF
aws s3api put-bucket-policy --bucket gaurav.one --policy file:///tmp/bucket-policy.json

# 7. SES domain verify + DKIM (add returned records to Route53)
aws ses verify-domain-identity --domain mail.gaurav.one --region us-east-1
aws ses verify-domain-dkim    --domain mail.gaurav.one --region us-east-1

# 8. SES receipt rule → S3
aws ses create-receipt-rule-set --rule-set-name default-inbound --region us-east-1 || true
aws ses create-receipt-rule --rule-set-name default-inbound --region us-east-1 \
  --rule '{"Name":"inbound-to-s3","Enabled":true,"ScanEnabled":true,"TlsPolicy":"Optional","Recipients":["mail.gaurav.one"],"Actions":[{"S3Action":{"BucketName":"gaurav.one","ObjectKeyPrefix":"inbound/"}}]}'
aws ses set-active-receipt-rule-set --rule-set-name default-inbound --region us-east-1

# 9. Smoke test: send email to anything@mail.gaurav.one, then:
aws logs tail /aws/lambda/ses-inbound --follow --region us-east-1
