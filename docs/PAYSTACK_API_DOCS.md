# Paystack Payment Gateway API Documentation

This document provides comprehensive documentation for all Paystack payment gateway endpoints in the UnravelDocs API.

---

## Table of Contents

1. [Transaction Endpoints](#transaction-endpoints)
2. [Subscription Endpoints](#subscription-endpoints)
3. [Callback Endpoints](#callback-endpoints)
4. [Webhook Endpoints](#webhook-endpoints)

---

## Authentication

All endpoints (except webhooks and callbacks) require Bearer token authentication.

```
Authorization: Bearer <access_token>
```

---

## Transaction Endpoints

Base URL: `/api/v1/paystack`

### Initialize Transaction

Initializes a payment transaction or subscription.

**Endpoint:** `POST /api/v1/paystack/transaction/initialize`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |
| Content-Type | string | Yes | application/json |

**Request Body:**
```json
{
  "amount": 200,
  "email": "afiaaniebiet@gmail.com",
  "currency": "NGN",
  "callbackUrl": "http://localhost:8080/api/v1/paystack/callback",
  "metadata": {}
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Customer's email address (valid email format) |
| amount | long | Yes | Amount in kobo (lowest currency unit). e.g., 500000 = ₦5,000 |
| callbackUrl | string | No | URL to redirect after payment |
| reference | string | No | Unique transaction reference (auto-generated if not provided) |
| currency | string | No | Currency code (default: NGN) |
| planCode | string | No | Paystack plan code for subscriptions |
| subscriptionStartDate | string | No | When subscription should start |
| channels | array | No | Payment channels to allow: `card`, `bank`, `ussd`, `qr`, `mobile_money`, `bank_transfer`, `eft` |
| metadata | object | No | Custom metadata (max 1MB) |
| subaccount | string | No | Subaccount code for split payments |
| splitCode | string | No | Split code for multi-split payments |
| bearer | string | No | Who bears transaction charges: `account` or `subaccount` |

**Response:**
```json
{
  "message": "Transaction initialized successfully",
  "status": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/acic78370d6vl9c",
    "access_code": "acic78370d6vl9c",
    "reference": "PAY_A8DF88D0F95F4079"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| authorizationUrl | string | URL to redirect customer for payment |
| accessCode | string | Access code for Paystack inline checkout |
| reference | string | Transaction reference |

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Transaction initialized successfully |
| 400 | Invalid request |
| 500 | Failed to initialize transaction |

---

### Verify Transaction

Verifies the status of a transaction.

**Endpoint:** `GET /api/v1/paystack/transaction/verify/{reference}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reference | string | Yes | Transaction reference |

**Response:**
```json
{
  "message": "Transaction verified successfully",
  "status": true,
  "data": {
    "id": 5693053185,
    "domain": "live",
    "status": "success",
    "reference": "PAY_A8DF88D0F95F4079",
    "amount": 20000,
    "message": null,
    "gateway_response": "Approved",
    "paid_at": "2026-01-01T12:57:57.000Z",
    "created_at": "2026-01-01T12:56:06.000Z",
    "channel": "bank_transfer",
    "currency": "NGN",
    "ip_address": "102.91.102.120",
    "metadata": {
      "user_id": "30e08f7d-9821-49f8-b0b6-f0bbc98d0fa4",
      "customer_code": "CUS_hl1l3ck1uf867pe"
    },
    "customer": {
      "id": 329439068,
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@unraveldocs.xyz",
      "customer_code": "CUS_hl1l3ck1uf867pe",
      "phone": null,
      "metadata": {
        "user_id": "30e08f7d-9821-49f8-b0b6-f0bbc98d0fa4"
      },
      "risk_action": "default",
      "international_format_phone": null
    },
    "authorization": {
      "authorization_code": "AUTH_3o211dyxax",
      "bin": "807XXX",
      "last4": "X288",
      "exp_month": "01",
      "exp_year": "2026",
      "channel": "bank_transfer",
      "card_type": "transfer",
      "bank": "OPay Digital Services Limited (OPay)",
      "country_code": "NG",
      "brand": "Managed Account",
      "reusable": false,
      "signature": null,
      "account_name": null,
      "receiver_bank_account_number": null,
      "receiver_bank": null
    },
    "plan_object": {
      "id": null,
      "name": null,
      "plan_code": null,
      "description": null,
      "amount": null,
      "interval": null,
      "currency": null,
      "send_invoices": null,
      "send_sms": null,
      "hosted_page": null,
      "hosted_page_url": null,
      "hosted_page_summary": null,
      "is_deleted": null,
      "is_archived": null,
      "invoice_limit": null,
      "created_at": null,
      "updated_at": null
    },
    "fees": 300,
    "fees_split": null,
    "requested_amount": 20000,
    "transaction_date": "2026-01-01T12:56:06.000Z"
  }
}
```

**Transaction Statuses:**
| Status | Description |
|--------|-------------|
| success | Transaction successful |
| failed | Transaction failed |
| abandoned | Customer abandoned transaction |
| pending | Transaction is pending |
| reversed | Transaction was reversed |
| queued | Transaction is queued |

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Transaction verified successfully |
| 404 | Transaction not found |

---

### Charge Authorization

Charges a previously saved authorization for recurring payments.

**Endpoint:** `POST /api/v1/paystack/transaction/charge-authorization`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| authorizationCode | string | Yes | Saved authorization code |
| amount | long | Yes | Amount in kobo |
| currency | string | No | Currency code (default: NGN) |

**Response:**
```json
{
  "data": {
    "id": 5742861839,
    "domain": "test",
    "status": "success",
    "reference": "PAY_0829A4A9677443E0",
    "amount": 13950,
    "message": null,
    "gateway_response": "Successful",
    "paid_at": "2026-01-16T20:07:03.000Z",
    "created_at": "2026-01-16T20:00:04.000Z",
    "channel": "card",
    "currency": "NGN",
    "ip_address": "102.91.78.50",
    "metadata": {
      "user_id": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "customer_code": "CUS_4j89dxhhh4w7fce"
    },
    "customer": {
      "id": 332360587,
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@unraveldocs.xyz",
      "customer_code": "CUS_4j89dxhhh4w7fce",
      "phone": null,
      "metadata": {
        "user_id": "d28feb5b-4fc9-4653-aae4-285ce0a70975"
      },
      "risk_action": "default",
      "international_format_phone": null
    },
    "authorization": {
      "authorization_code": "AUTH_mnc9g3l3lf",
      "bin": "408408",
      "last4": "4081",
      "exp_month": "12",
      "exp_year": "2030",
      "channel": "card",
      "card_type": "visa ",
      "bank": "TEST BANK",
      "country_code": "NG",
      "brand": "visa",
      "reusable": true,
      "signature": "SIG_YcrcxarF4IMjUuAUNurj",
      "account_name": null,
      "receiver_bank_account_number": null,
      "receiver_bank": null
    },
    "plan_object": {
      "id": null,
      "name": null,
      "plan_code": null,
      "description": null,
      "amount": null,
      "interval": null,
      "currency": null,
      "send_invoices": null,
      "send_sms": null,
      "hosted_page": null,
      "hosted_page_url": null,
      "hosted_page_summary": null,
      "is_deleted": null,
      "is_archived": null,
      "invoice_limit": null,
      "created_at": null,
      "updated_at": null
    },
    "fees": 210,
    "fees_split": null,
    "requested_amount": 13950,
    "transaction_date": "2026-01-16T20:00:04.000Z"
  },
  "message": "Transaction verified successfully",
  "status": true
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Authorization charged successfully |
| 400 | Invalid authorization or amount |
| 500 | Charge failed |

---

### Get Payment History

Retrieves paginated payment history for the authenticated user.

**Endpoint:** `GET /api/v1/paystack/transaction/history`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | int | No | 0 | Page number (0-indexed) |
| size | int | No | 20 | Page size |
| sort | string | No | createdAt,desc | Sort field and direction |

**Response:**
```json
{
  "content": [
    {
      "id": "b251792f-c017-4dd9-8184-dcd41317cef7",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_F3A07C441B6548C9",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 1999.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T02:18:56.146008Z"
    },
    {
      "id": "c064592b-e61a-4bdb-a79f-5db1b65b876c",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_19BC1CB1455E45FF",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 1999.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T02:22:59.208917Z"
    },
    {
      "id": "06d0c75b-b913-441c-bee5-bc28e98a27bd",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_DB26B8CC46014FDC",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 1999.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T02:44:52.297638Z"
    },
    {
      "id": "39b2856d-2b13-4675-aae8-c9aab595b3bc",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_5063A1625486446A",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 2945000.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T02:59:44.590642Z"
    },
    {
      "id": "da8d728b-ce9f-4523-8f99-6019738f89e8",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_FBAA418C8DB84671",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 2945000.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T03:35:34.793933Z"
    },
    {
      "id": "d41bcb95-3e30-47b2-8ccc-1ca6f9689847",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_0B70DBE52EC54264",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 1395000.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T03:40:40.206985Z"
    },
    {
      "id": "02d61a31-8be1-44f2-841d-e21a76b4c744",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_BC11915B5B0140F0",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 1395000.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T03:53:53.817719Z"
    },
    {
      "id": "a957c525-02ee-4707-80a3-52ddffbd40cc",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_B5D6F13853FB4E1B",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 1395000.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T04:04:01.970795Z"
    },
    {
      "id": "b97d9b3e-bafd-49ed-aff2-fa8d35d459ab",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_CB0E24B7CCCF4863",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 1395000.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T04:12:31.099823Z"
    },
    {
      "id": "71b9cc3a-2e4a-41c5-ad5b-72c1cfc65d2e",
      "userId": "d28feb5b-4fc9-4653-aae4-285ce0a70975",
      "userEmail": "admin@unraveldocs.xyz",
      "transaction_id": null,
      "reference": "PAY_C68A37A2C2544351",
      "plan_code": null,
      "subscription_code": null,
      "payment_type": "ONE_TIME",
      "status": "PENDING",
      "amount": 1395000.00,
      "currency": "NGN",
      "amount_refunded": null,
      "fees": null,
      "channel": null,
      "gateway_response": null,
      "description": null,
      "failure_message": null,
      "paid_at": null,
      "created_at": "2026-01-15T04:16:53.96783Z"
    }
  ],
  "empty": false,
  "first": true,
  "last": true,
  "number": 0,
  "numberOfElements": 10,
  "pageable": {
    "offset": 0,
    "pageNumber": 0,
    "pageSize": 20,
    "paged": true,
    "sort": {
      "empty": true,
      "sorted": false,
      "unsorted": true
    },
    "unpaged": false
  },
  "size": 20,
  "sort": {
    "empty": true,
    "sorted": false,
    "unsorted": true
  },
  "totalElements": 10,
  "totalPages": 1
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Payment history retrieved successfully |

---

### Get Payment by Reference

Retrieves a specific payment by its reference.

**Endpoint:** `GET /api/v1/paystack/transaction/{reference}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reference | string | Yes | Transaction reference |

**Response:** PaystackPayment entity

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Payment retrieved successfully |
| 404 | Payment not found |

---

## Subscription Endpoints

Base URL: `/api/v1/paystack`

### Create Subscription

Creates a new Paystack subscription.

**Endpoint:** `POST /api/v1/paystack/subscription`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |
| Content-Type | string | Yes | application/json |

**Request Body:**
```json
{
  "customer": "CUS_xxx",
  "planName": "PRO_MONTHLY",
  "authorization": "AUTH_xxx",
  "startDate": "2024-02-01T00:00:00Z"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customer | string | Yes | Customer email or code |
| planName | string | Yes | Subscription plan name |
| authorization | string | No | Authorization code for charging |
| startDate | string | No | Subscription start date (ISO 8601) |

**Response:**
```json
{
  "status": true,
  "message": "Subscription created successfully",
  "data": {
    "id": "uuid",
    "subscriptionCode": "SUB_xxx",
    "status": "active",
    "emailToken": "xxx",
    "amount": 500000,
    "nextPaymentDate": "2024-02-01T00:00:00Z",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**Subscription Statuses:**
| Status | Description |
|--------|-------------|
| active | Subscription is active |
| non-renewing | Will not renew |
| attention | Requires attention |
| completed | Subscription completed |
| cancelled | Subscription cancelled |

**Status Codes:**
| Code | Description |
|------|-------------|
| 201 | Subscription created successfully |
| 400 | Invalid request |
| 500 | Failed to create subscription |

---

### Get Subscription by Code

Retrieves a subscription by its code.

**Endpoint:** `GET /api/v1/paystack/subscription/{subscriptionCode}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subscriptionCode | string | Yes | Paystack subscription code |

**Response:** PaystackSubscription entity

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Subscription retrieved successfully |
| 404 | Subscription not found |

---

### Get Active Subscription

Retrieves the active subscription for the authenticated user.

**Endpoint:** `GET /api/v1/paystack/subscription/active`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

**Response:** PaystackSubscription entity

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Active subscription found |
| 404 | No active subscription |

---

### Get Subscription History

Retrieves paginated subscription history.

**Endpoint:** `GET /api/v1/paystack/subscriptions`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | int | No | 0 | Page number |
| size | int | No | 20 | Page size |

**Response:** Paginated PaystackSubscription entities

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Subscription history retrieved successfully |

---

### Enable Subscription

Enables a previously disabled subscription.

**Endpoint:** `POST /api/v1/paystack/subscription/{subscriptionCode}/enable`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subscriptionCode | string | Yes | Paystack subscription code |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| emailToken | string | Yes | Email token for subscription management |

**Response:**
```json
{
  "status": true,
  "message": "Subscription enabled successfully",
  "data": {
    "subscriptionCode": "SUB_xxx",
    "status": "active",
    ...
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Subscription enabled successfully |
| 400 | Invalid email token |
| 404 | Subscription not found |

---

### Disable Subscription

Disables (cancels) a subscription.

**Endpoint:** `POST /api/v1/paystack/subscription/{subscriptionCode}/disable`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subscriptionCode | string | Yes | Paystack subscription code |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| emailToken | string | Yes | Email token for subscription management |

**Response:**
```json
{
  "status": true,
  "message": "Subscription disabled successfully",
  "data": {
    "subscriptionCode": "SUB_xxx",
    "status": "cancelled",
    ...
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Subscription disabled successfully |
| 400 | Invalid email token |
| 404 | Subscription not found |

---

## Callback Endpoints

Base URL: `/api/v1/paystack`

### Payment Callback

Callback URL for Paystack payment redirect.

**Endpoint:** `GET /api/v1/paystack/callback`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reference | string | Yes | Transaction reference |
| trxref | string | No | Alternative reference (fallback) |

**Response:**
```json
{
  "status": true,
  "message": "Payment success",
  "data": {
    "id": 123456789,
    "status": "success",
    "reference": "TXN_123456",
    "amount": 500000,
    ...
  }
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Callback processed successfully |

---

## Webhook Endpoints

Base URL: `/api/v1/paystack/webhook`

### Handle Paystack Webhook

Receives and processes Paystack webhook events.

**Endpoint:** `POST /api/v1/paystack/webhook`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| x-paystack-signature | string | No | HMAC SHA512 signature for verification |

**Request Body:**
```json
{
  "event": "charge.success",
  "data": {
    "id": 123456789,
    "domain": "test",
    "status": "success",
    "reference": "TXN_123456",
    "amount": 500000,
    "gateway_response": "Successful",
    "paid_at": "2024-01-01T12:00:00.000Z",
    "created_at": "2024-01-01T11:55:00.000Z",
    "channel": "card",
    "currency": "NGN",
    "customer": {
      "id": 12345,
      "email": "user@example.com",
      "customer_code": "CUS_xxx"
    },
    "authorization": {
      "authorization_code": "AUTH_xxx",
      "card_type": "visa",
      "last4": "4081",
      "exp_month": "12",
      "exp_year": "2025",
      "reusable": true
    },
    "plan": null,
    "metadata": {}
  }
}
```

**Supported Event Types:**
| Event Type | Description |
|------------|-------------|
| `charge.success` | Successful payment |
| `charge.failed` | Failed payment |
| `subscription.create` | Subscription created |
| `subscription.enable` | Subscription enabled |
| `subscription.disable` | Subscription disabled |
| `subscription.not_renew` | Subscription set to not renew |
| `invoice.create` | Invoice created |
| `invoice.payment_failed` | Invoice payment failed |
| `invoice.update` | Invoice updated |
| `transfer.success` | Transfer successful |
| `transfer.failed` | Transfer failed |
| `transfer.reversed` | Transfer reversed |
| `refund.pending` | Refund is pending |
| `refund.processed` | Refund processed |
| `refund.failed` | Refund failed |

**Response:**
| Body | Description |
|------|-------------|
| `Webhook processed successfully` | Event processed |

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Webhook processed successfully |
| 400 | Invalid signature or payload |
| 500 | Processing error |

---

### Webhook Health Check

Checks if the webhook endpoint is healthy.

**Endpoint:** `GET /api/v1/paystack/webhook/health`

**Response:**
```
Webhook endpoint is healthy
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Endpoint is healthy |

---

## Error Responses

All endpoints may return the following error format:

```json
{
  "status": false,
  "message": "Error description"
}
```

Or for webhook errors:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid webhook signature",
  "path": "/api/v1/paystack/webhook"
}
```

---

## Currency and Amount Notes

**Amount Representation:**
- All amounts are in the **lowest currency unit** (kobo for NGN, cents for USD)
- Example: ₦5,000 = 500000 kobo
- Example: $50.00 = 5000 cents

**Supported Currencies:**
| Currency | Code | Country |
|----------|------|---------|
| Nigerian Naira | NGN | Nigeria |
| Ghanaian Cedi | GHS | Ghana |
| South African Rand | ZAR | South Africa |
| Kenyan Shilling | KES | Kenya |
| US Dollar | USD | International |

---

## Payment Channels

| Channel | Description |
|---------|-------------|
| card | Debit/Credit card |
| bank | Bank account |
| ussd | USSD payment |
| qr | QR code payment |
| mobile_money | Mobile money |
| bank_transfer | Bank transfer |
| eft | Electronic funds transfer |

---

## Configuration

The following environment variables must be configured:

```properties
paystack.secret-key=sk_test_xxx
paystack.public-key=pk_test_xxx
paystack.callback-url=https://yourapp.com/paystack/callback
paystack.webhook-secret=whsec_xxx
```

---

## Webhook Signature Verification

Paystack signs all webhook payloads with HMAC SHA512 using your secret key.

**Verification Process:**
1. Get the `x-paystack-signature` header
2. Hash the request body using HMAC SHA512 with your secret key
3. Compare the computed hash with the signature header

**Example (Java):**
```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public boolean verifySignature(String payload, String signature, String secretKey) {
    try {
        Mac sha512Hmac = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKeySpec = new SecretKeySpec(
            secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        sha512Hmac.init(secretKeySpec);
        byte[] hash = sha512Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        String computedSignature = bytesToHex(hash);
        return computedSignature.equals(signature);
    } catch (Exception e) {
        return false;
    }
}
```

---

## Testing

Use Paystack test mode with test API keys:

**Test Cards:**
| Card Number | Description |
|-------------|-------------|
| 4084084084084081 | Successful transaction |
| 4084080000005408 | Declined transaction |
| 5060666666666666666 | Verve successful |
| 507850785078507812 | Verve declined |

**Test Bank Account:**
- Bank: Test Bank
- Account Number: 0000000000

**Test Authorization Code:**
Use any previous successful test transaction's authorization code.

---

## Rate Limits

Paystack implements rate limiting on their API:
- **Live mode:** 10 requests per second
- **Test mode:** More lenient limits

The application does not add additional rate limiting.

---

*Documentation last updated: January 2024*
