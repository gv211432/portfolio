# SES Inbound → Webhook Lambda

Bridges AWS SES inbound mail into the Postgres mailbox via the
`POST /api/mail/inbound` webhook.

## Architecture

```
sender → MX (mail.gaurav.one) → SES receipt rule
              → S3 PUT  s3://$BUCKET/inbound/<messageId>
                   └─ S3:ObjectCreated event → Lambda (this package)
                         └─ parses .eml, uploads attachments,
                            POSTs JSON to https://gaurav.one/api/mail/inbound
                            (x-api-key: MAIL_WEBHOOK_API_KEY)
```

Raw `.eml` stays in S3 forever (or until a lifecycle policy trims it).
Attachments are re-uploaded under `attachments/<messageId>/<n>-<file>` so the
Next.js app can serve them via signed URLs.

---

## 1. S3 bucket

```
aws s3 mb s3://gaurav-mail --region ap-south-1
```

Block public access (default). The app reaches the bucket via IAM.

Bucket policy: allow SES to `PutObject` into `inbound/*`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPut",
      "Effect": "Allow",
      "Principal": { "Service": "ses.amazonaws.com" },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::gaurav-mail/inbound/*",
      "Condition": {
        "StringEquals": {
          "aws:Referer": "<YOUR_AWS_ACCOUNT_ID>"
        }
      }
    }
  ]
}
```

---

## 2. MX record

In your DNS provider (for domain `mail.gaurav.one`):

```
mail.gaurav.one.   MX   10   inbound-smtp.ap-south-1.amazonaws.com.
```

(replace region if not `ap-south-1`). Also add SPF + DKIM + DMARC for outbound:

```
mail.gaurav.one.   TXT   "v=spf1 include:amazonses.com -all"
_dmarc.mail.gaurav.one.   TXT   "v=DMARC1; p=quarantine; rua=mailto:postmaster@gaurav.one"
```

DKIM: run `aws ses verify-domain-dkim --domain mail.gaurav.one` and copy the
three CNAMEs it returns into DNS.

---

## 3. SES domain + receipt rule

Verify the domain:

```
aws ses verify-domain-identity --domain mail.gaurav.one --region ap-south-1
```

Create a receipt rule set + rule that drops to S3:

```
aws ses create-receipt-rule-set --rule-set-name default-inbound

aws ses create-receipt-rule \
  --rule-set-name default-inbound \
  --rule '{
    "Name": "inbound-to-s3",
    "Enabled": true,
    "ScanEnabled": true,
    "TlsPolicy": "Optional",
    "Recipients": ["mail.gaurav.one"],
    "Actions": [
      { "S3Action": { "BucketName": "gaurav-mail", "ObjectKeyPrefix": "inbound/" } }
    ]
  }'

aws ses set-active-receipt-rule-set --rule-set-name default-inbound
```

---

## 4. Lambda

### Build the deployment zip

```
cd lambda/ses-inbound
bun install            # or: npm install --omit=dev
zip -qr fn.zip index.mjs package.json node_modules
```

### Create the function

```
aws lambda create-function \
  --function-name ses-inbound \
  --runtime nodejs20.x \
  --handler index.handler \
  --zip-file fileb://fn.zip \
  --role arn:aws:iam::<ACCOUNT_ID>:role/ses-inbound-role \
  --timeout 30 --memory-size 512 \
  --environment "Variables={
    WEBHOOK_URL=https://gaurav.one/api/mail/inbound,
    WEBHOOK_API_KEY=<MAIL_WEBHOOK_API_KEY>,
    BUCKET=gaurav-mail,
    ATTACHMENT_PREFIX=attachments/
  }"
```

### S3 event → Lambda

```
aws lambda add-permission \
  --function-name ses-inbound \
  --statement-id s3invoke --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::gaurav-mail

aws s3api put-bucket-notification-configuration --bucket gaurav-mail \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [{
      "LambdaFunctionArn": "arn:aws:lambda:ap-south-1:<ACCOUNT_ID>:function:ses-inbound",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": { "Key": { "FilterRules": [{ "Name": "prefix", "Value": "inbound/" }] } }
    }]
  }'
```

---

## 5. IAM role (`ses-inbound-role`) policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["s3:GetObject"], "Resource": "arn:aws:s3:::gaurav-mail/inbound/*" },
    { "Effect": "Allow", "Action": ["s3:PutObject"], "Resource": "arn:aws:s3:::gaurav-mail/attachments/*" }
  ]
}
```

Trust policy: `lambda.amazonaws.com`.

---

## 6. App IAM user (for the Next.js app)

The app needs to read attachments (signed URLs) and send via SES.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject"], "Resource": "arn:aws:s3:::gaurav-mail/*" },
    { "Effect": "Allow", "Action": ["ses:SendRawEmail","ses:SendEmail"], "Resource": "*" }
  ]
}
```

Put the access key + secret in Railway env (`AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, `AWS_REGION=ap-south-1`).

---

## 7. Webhook contract (reference)

The Lambda POSTs this shape — must match the route handler at
`src/app/api/mail/inbound/route.ts`:

```jsonc
{
  "messageId": "<msg@ses>",
  "s3Key": "inbound/<messageId>",
  "sizeBytes": 12345,
  "date": "2026-04-15T10:00:00.000Z",
  "from": { "email": "sender@x.com", "name": "Sender" },
  "to":   [{ "email": "user@mail.gaurav.one" }],
  "cc":   [],
  "bcc":  [],
  "subject": "Hello",
  "text": "Plain body",
  "html": "<p>Plain body</p>",
  "snippet": "Plain body",
  "inReplyTo": "<parent@id>",
  "references": ["<grandparent@id>","<parent@id>"],
  "attachments": [
    { "filename": "doc.pdf", "contentType": "application/pdf", "sizeBytes": 4096,
      "s3Key": "attachments/<messageId>/1-doc.pdf", "contentId": "cid-xyz" }
  ]
}
```

Auth header: `x-api-key: <MAIL_WEBHOOK_API_KEY>` (the same value as in Lambda env
and in the Next.js app `.env`).

---

## 8. Operational notes

- **Retries**: on a 5xx webhook response, Lambda throws → AWS retries with
  exponential backoff. Configure an SQS DLQ for poison records.
- **Idempotency**: duplicate deliveries are safely ignored by the webhook
  (one Email row per `(staffId, messageId)`).
- **Large messages**: SES caps inbound at 40 MB. Lambda memory set to 512 MB
  is enough for attachments up to ~30 MB after base64 decode.
- **Lifecycle**: add an S3 lifecycle rule to expire `inbound/` raw eml
  after 180 days if you don't need long-term archives.
