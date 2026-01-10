# CareOS - BusinessOS Integration API

> API endpoint for CareOS to receive leads from BusinessOS (or other partners).

---

## Overview

This integration allows partner platforms (like BusinessOS) to securely send healthcare leads to CareOS. The integration includes:

- **Secure Authentication**: API key-based authentication
- **Encrypted Phone Transfer**: RSA-OAEP encryption for phone numbers
- **Automatic User Creation**: Creates CareOS users from partner referrals
- **Lead Tracking**: Tracks leads with partner attribution
- **Payment Processing**: Automated partner payment tracking
- **Welcome Messages**: Automatic SMS welcome to referred users

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [API Endpoint](#api-endpoint)
3. [Authentication](#authentication)
4. [Request Format](#request-format)
5. [Response Format](#response-format)
6. [Encryption Setup](#encryption-setup)
7. [Testing](#testing)
8. [Payment Processing](#payment-processing)
9. [Error Handling](#error-handling)

---

## Quick Start

### 1. Generate API Keys

```bash
# Generate keys for BusinessOS integration
npx ts-node scripts/generate-partner-keys.ts businessos live
```

This generates:
- API key for BusinessOS to authenticate with CareOS
- RSA key pair for encrypted phone number transfer

### 2. Configure Environment Variables

**CareOS .env:**
```env
# BusinessOS Integration
BUSINESSOS_API_KEY="businessos_live_xxxxxxxxxxxxxxxx"
CAREOS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
CAREOS_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

**BusinessOS .env:**
```env
# CareOS Integration
CAREOS_API_KEY="careos_live_xxxxxxxxxxxxxxxx"
CAREOS_API_URL="https://api.careos.app"
CAREOS_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

### 3. Run Database Migration

```bash
# Add PartnerPayment model and partner referral fields
npx prisma migrate dev --name add_partner_integration
npx prisma generate
```

### 4. Test the Integration

```bash
# Test from BusinessOS side
curl -X POST https://api.careos.app/api/leads/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: businessos_live_test123" \
  -H "X-Platform: businessos" \
  -d '{
    "source_platform": "businessos",
    "source_conversation_id": "test-123",
    "user_phone_hash": "abc123hash",
    "user_phone_encrypted": "base64encryptedphone",
    "user_name": "Test User",
    "user_language": "en",
    "category": "healthcare",
    "subcategory": "caregiver_hiring",
    "original_message": "I need a caregiver for my mom",
    "ai_extracted_details": {
      "urgency": "medium",
      "person_mentioned": "mom",
      "service_type": "caregiver"
    },
    "user_consent": true,
    "consent_timestamp": "2025-01-08T12:00:00Z",
    "lead_value_agreed": 10
  }'
```

---

## API Endpoint

### POST /api/leads/ingest

**Purpose:** Receive healthcare leads from BusinessOS (or other partners)

**Authentication:**
```
Headers:
  X-API-Key: businessos_live_xxxxxxxx
  X-Platform: businessos
```

**Base URL:**
- Production: `https://api.careos.app`
- Development: `http://localhost:3000`

---

## Authentication

### API Key Authentication

The integration uses API key-based authentication. Include these headers in every request:

```
X-API-Key: <your_api_key>
X-Platform: <partner_name>
```

**Valid Platforms:**
- `businessos`
- (Add more as needed)

### Invalid Authentication Response

```json
{
  "error": "Invalid API key"
}
```

**Status Code:** `401 Unauthorized`

---

## Request Format

### Request Headers

```http
Content-Type: application/json
X-API-Key: businessos_live_xxxxxxxx
X-Platform: businessos
```

### Request Body

```typescript
interface InboundLead {
  source_platform: string;          // 'businessos'
  source_conversation_id: string;   // Unique ID from BusinessOS
  user_phone_hash: string;          // SHA-256 hash of phone number
  user_phone_encrypted: string;     // RSA-OAEP encrypted phone number
  user_name?: string;               // User's name (optional)
  user_language: string;            // ISO language code: 'en', 'es', 'fr', etc.
  user_location_state?: string;     // US state code or equivalent
  user_location_country?: string;   // ISO country code: 'US', 'CA', etc.
  user_location_city?: string;      // City name
  category: string;                 // 'healthcare', 'caregiver', etc.
  subcategory?: string;             // 'caregiver_hiring', 'telehealth', etc.
  original_message: string;         // Original user message
  ai_extracted_details: {
    urgency?: string;               // 'low', 'medium', 'high'
    person_mentioned?: string;      // 'mom', 'dad', etc.
    service_type?: string;          // 'caregiver', 'doctor', etc.
    condition_mentioned?: string;   // Medical condition if mentioned
  };
  user_consent: boolean;            // Must be true
  consent_timestamp: string;        // ISO 8601 timestamp
  lead_value_agreed: number;        // Payment amount in USD
}
```

### Example Request

```json
{
  "source_platform": "businessos",
  "source_conversation_id": "bizos-lead-12345",
  "user_phone_hash": "a1b2c3d4e5f6...",
  "user_phone_encrypted": "base64encryptedphonenumber...",
  "user_name": "John Doe",
  "user_language": "en",
  "user_location_state": "CA",
  "user_location_country": "US",
  "user_location_city": "San Francisco",
  "category": "healthcare",
  "subcategory": "caregiver_hiring",
  "original_message": "I need help finding a caregiver for my mom who has mobility issues",
  "ai_extracted_details": {
    "urgency": "medium",
    "person_mentioned": "mom",
    "service_type": "caregiver",
    "condition_mentioned": "mobility issues"
  },
  "user_consent": true,
  "consent_timestamp": "2025-01-08T12:00:00Z",
  "lead_value_agreed": 15.00
}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "careos_lead_id": "lead_clx123abc",
  "careos_user_id": "user_clx456def",
  "careos_will_contact": true,
  "is_new_user": true
}
```

**Status Code:** `200 OK`

### Error Responses

#### Missing Required Fields

```json
{
  "error": "Missing required fields: user_phone_encrypted or original_message"
}
```

**Status Code:** `400 Bad Request`

#### Missing Consent

```json
{
  "error": "User consent required"
}
```

**Status Code:** `400 Bad Request`

#### Decryption Failure

```json
{
  "error": "Failed to decrypt user data"
}
```

**Status Code:** `400 Bad Request`

#### Invalid API Key

```json
{
  "error": "Invalid API key"
}
```

**Status Code:** `401 Unauthorized`

#### Server Error

```json
{
  "error": "Internal server error"
}
```

**Status Code:** `500 Internal Server Error`

---

## Encryption Setup

### Phone Number Encryption

Phone numbers must be encrypted using **RSA-OAEP** padding with **SHA-256** hash before sending to CareOS.

### Encryption Process (BusinessOS Side)

```typescript
import crypto from 'crypto';

function encryptPhoneForCareOS(phone: string, careosPublicKey: string): string {
  const buffer = Buffer.from(phone, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: careosPublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  );
  return encrypted.toString('base64');
}

// Hash phone for verification
function hashPhone(phone: string): string {
  return crypto
    .createHash('sha256')
    .update(phone + process.env.PHONE_HASH_SALT)
    .digest('hex');
}
```

### Decryption Process (CareOS Side)

CareOS automatically decrypts the phone number using the private key stored in `CAREOS_PRIVATE_KEY`.

---

## Testing

### 1. Test with Mock Data

Use the provided test script or manually test with curl:

```bash
curl -X POST http://localhost:3000/api/leads/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: businessos_live_test123" \
  -H "X-Platform: businessos" \
  -d @test-lead.json
```

### 2. Verify in CareOS

After sending a test lead:

- **Check Database:**
  ```sql
  -- Check new user
  SELECT * FROM "User" WHERE "source" = 'businessos_referral';
  
  -- Check new lead
  SELECT * FROM "Lead" WHERE "sourcePlatform" = 'businessos';
  
  -- Check partner payment
  SELECT * FROM "PartnerPayment" WHERE "partner" = 'businessos';
  ```

- **Check SMS:**
  - User should receive welcome SMS from CareOS
  - Check Twilio logs for message delivery

- **Check Admin Dashboard:**
  - Navigate to `/admin/leads`
  - Verify lead appears with partner attribution

---

## Payment Processing

### Partner Payment Tracking

When a lead is received, CareOS automatically creates a `PartnerPayment` record with:

- **Status:** `pending`
- **Due Date:** 30 days from lead creation
- **Amount:** `lead_value_agreed` from request

### Payment Processing

Payments are processed monthly via scheduled job:

```typescript
// Run monthly to process partner payments
import { processPartnerPayments } from '@/lib/partner-payments';

// This function:
// 1. Aggregates pending payments by partner
// 2. Checks minimum payout thresholds
// 3. Processes payments via Stripe (if configured)
// 4. Marks payments as paid
// 5. Notifies partners

await processPartnerPayments();
```

### Payment Status

- **pending:** Awaiting payout
- **paid:** Payment processed
- **disputed:** Payment disputed
- **cancelled:** Payment cancelled

---

## Error Handling

### Common Errors

1. **Invalid API Key**
   - Verify `X-API-Key` header matches `BUSINESSOS_API_KEY` in CareOS .env
   - Verify `X-Platform` header matches registered platform

2. **Decryption Failure**
   - Verify `CAREOS_PUBLIC_KEY` in BusinessOS matches `CAREOS_PRIVATE_KEY` in CareOS
   - Ensure phone number is properly formatted before encryption

3. **Phone Hash Mismatch**
   - Verify hash is generated with same salt on both platforms
   - Ensure phone number format is consistent (E.164 format recommended)

4. **Missing Consent**
   - Ensure `user_consent: true` in request
   - Ensure `consent_timestamp` is valid ISO 8601 format

### Retry Logic

For failed requests:
- Retry up to 3 times with exponential backoff
- Log all failed attempts
- Notify support after 3 failed retries

---

## Integration Flow

```
┌─────────────────┐                    ┌─────────────────┐
│   BUSINESSOS    │                    │     CAREOS      │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  1. User texts: "Need caregiver      │
         │     for my mom"                      │
         │                                      │
         │  2. AI detects healthcare need       │
         │                                      │
         │  3. Ask user consent                 │
         │     "Want me to connect you with     │
         │      CareOS? Reply YES"              │
         │                                      │
         │  4. User replies "YES"               │
         │                                      │
         │  5. POST /api/leads/ingest ─────────▶│
         │     {                                │
         │       phone_encrypted,               │
         │       original_message,              │
         │       consent: true,                 │
         │       ...                            │
         │     }                                │
         │                                      │  6. Decrypt phone
         │                                      │  7. Create user/lead
         │                                      │  8. Send welcome SMS
         │◀──────────────────────────────────────│  9. Create payment record
         │  10. { success: true,                │
         │       careos_lead_id }               │
         │                                      │
         │ 11. "Great! CareOS will text         │
         │      you shortly."                   │
         │                                      │
         │                              ┌───────┴───────┐
         │                              │ User now in   │
         │                              │ CareOS system │
         │                              └───────────────┘
         │                                      │
    ─────┴──────────────────────────────────────┴─────
                    30 days later
    ──────────────────────────────────────────────────
         │                                      │
         │◀──────── $15 payment via Stripe ─────│
         │                                      │
```

---

## Category Mapping

BusinessOS categories are automatically mapped to CareOS healthcare categories:

| BusinessOS Category | CareOS Category |
|---------------------|-----------------|
| `healthcare`, `health`, `medical` | `general_healthcare` |
| `caregiver`, `caregiver_hiring`, `staffing_hiring` | `caregiver_hiring` |
| `doctor`, `telehealth`, `consulting_urgent` | `telehealth` |
| `medication`, `rx_management`, `prescription` | `rx_management` |
| `mental_health`, `therapy`, `counseling` | `mental_health` |
| `home_health`, `nursing` | `home_health` |
| `medical_equipment`, `equipment_supply` | `medical_equipment` |

See `lib/partner-integration.ts` for full mapping.

---

## Support

For integration support:
- Email: support@careos.app
- Documentation: https://docs.careos.app/partner-integration
- Status Page: https://status.careos.app

---

## Security

- **API Keys:** Rotate every 90 days
- **Encryption Keys:** Rotate every 6 months
- **Phone Numbers:** Never logged in plain text
- **Consent:** Always verified before lead creation
- **Rate Limiting:** 100 requests/minute per partner

---

## License

This integration is proprietary to CareOS and BusinessOS. Unauthorized use is prohibited.

