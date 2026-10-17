# M-Pesa payment webhook — spec for the paybill partner

The Optimas sales and expenses tracking system records M-Pesa payments that
you forward from your existing Daraja integration. We do not need the Daraja
keys: after Safaricom confirms a payment to you, POST it to us.

## Endpoint

```
POST https://sme.optimaswifi.co.ke/api/v1/payments/mpesa/webhook
Content-Type: application/json
X-Webhook-Secret: <secret we share with you privately>
```

If you cannot set a header, `Authorization: Bearer <secret>` or
`?token=<secret>` on the URL also work.

## Body

Send the C2B confirmation exactly as Safaricom gives it to you (field names
are not case-sensitive; extra fields are ignored):

| Field | Required | Example | Meaning |
| --- | --- | --- | --- |
| `TransID` | **yes** | `SJK3ABC12D` | M-Pesa receipt number (unique) |
| `TransAmount` | **yes** | `1500.00` | Amount paid, KSh |
| `TransTime` | recommended | `20261017143005` | Payment time, `YYYYMMDDHHmmss`, Nairobi time |
| `BillRefNumber` | recommended | `OPT1001` | Account number the customer typed |
| `MSISDN` | recommended | `254722111222` | Payer's phone (masked is fine) |
| `FirstName`, `MiddleName`, `LastName` | optional | `JANE` | Payer's name |
| `TransactionType` | optional | `Pay Bill` | |
| `BusinessShortCode` | optional | `4012345` | Paybill / till that received it |

Example:

```json
{
  "TransactionType": "Pay Bill",
  "TransID": "SJK3ABC12D",
  "TransTime": "20261017143005",
  "TransAmount": "1500.00",
  "BusinessShortCode": "4012345",
  "BillRefNumber": "OPT1001",
  "MSISDN": "254722111222",
  "FirstName": "JANE",
  "MiddleName": "",
  "LastName": "WANJIKU"
}
```

Test with curl:

```bash
curl -X POST https://sme.optimaswifi.co.ke/api/v1/payments/mpesa/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Secret: <secret>' \
  -d '{"TransID":"SJK3ABC12D","TransAmount":"1500.00","TransTime":"20261017143005","BillRefNumber":"OPT1001","MSISDN":"254722111222","FirstName":"JANE"}'
```

## Responses

| HTTP | Body | Action |
| --- | --- | --- |
| `200` | `{"success":true,"data":{"ResultCode":0,"ResultDesc":"Accepted","TransID":"SJK3ABC12D",...}}` | Recorded. Done. |
| `400` | `{"success":false,"error":{"code":"INVALID_TRANS_ID"…}}` | Payload is wrong; do not retry as is. |
| `401` | `BAD_WEBHOOK_SECRET` | Wrong or missing secret. |
| `5xx` / timeout | | Retry later. |

Retries are safe: a `TransID` we already have returns `200` again and is not
recorded twice. Please send only completed (successful) payments.

## What we do with it (for us)

Each payment becomes a paid M-Pesa sale under the business in
`MPESA_WEBHOOK_BUSINESS_ID`, with the receipt as its reference. It is linked
to the client whose account number (or service username) equals
`BillRefNumber`, else whose phone matches `BillRefNumber` or `MSISDN`;
otherwise it is recorded without a client. Set `MPESA_WEBHOOK_SECRET` and
`MPESA_WEBHOOK_BUSINESS_ID` in `backend/.env` and restart the API.
