# CareOS SMS Platform Setup Guide

## Overview

CareOS is an SMS-first healthcare coordination platform. Users sign up and interact entirely via text message - no app download required.

## Key Features

- **Zero Friction Signup**: User texts "HI" → completes 5-step onboarding → starts using immediately
- **TCPA Compliant**: Double opt-in, consent records, suppression list
- **Multi-Language**: Automatic language detection and localization
- **AI Classification**: Claude API classifies messages and generates responses
- **Lead Generation**: Monetizes unmet needs through partner referrals
- **WhatsApp Support**: Full WhatsApp integration with media handling
- **International**: Supports 180+ countries via Twilio

## Prerequisites

1. **Twilio Account**
   - Sign up at https://www.twilio.com
   - Get Account SID and Auth Token
   - Purchase a phone number (SMS-capable)
   - Optional: Set up WhatsApp Business API

2. **Anthropic API Key**
   - Sign up at https://www.anthropic.com
   - Get API key for Claude API

3. **PostgreSQL Database**
   - Running PostgreSQL instance
   - Database created

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env` file with all required variables (see README.md).

### 3. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name add_sms_platform
```

### 4. Configure Twilio Webhook

1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers
2. Select your phone number
3. Under "Messaging", set webhook URL:
   ```
   https://your-domain.com/api/sms/webhook
   ```
4. Set HTTP method to `POST`
5. Save configuration

### 5. Test SMS Flow

1. Text your Twilio number: `HI`
2. You should receive consent message
3. Reply: `YES`
4. Complete onboarding (name, email, password)
5. Start sending health updates!

## SMS Onboarding Flow

```
Step 1: User texts "HI"
        → System detects language
        → Sends consent disclosure
        → Waits for "YES" (double opt-in)

Step 2: User replies "YES"
        → Logs consent with timestamp, SID, carrier
        → Asks for first name

Step 3: User sends name
        → Stores name
        → Asks for email

Step 4: User sends email
        → Validates email format
        → Checks uniqueness
        → Asks for password

Step 5: User sends password
        → Validates (6+ characters)
        → Hashes with bcrypt
        → Creates account
        → Sends welcome message
```

## Mandatory Keywords (TCPA Required)

Always handled, even for non-users:

- **STOP, UNSUBSCRIBE, CANCEL, END, QUIT, STOPALL**: Opt-out
- **START, YES, UNSTOP, SUBSCRIBE**: Opt-in
- **HELP, INFO**: Help message

## Language Detection

Supported languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)

Language is auto-detected from first message. All subsequent responses are in user's language.

## AI Classification

Claude API classifies incoming messages into:
- `health`: Health updates, symptoms, vitals
- `task`: Tasks, reminders
- `appointment`: Appointments, scheduling
- `medication`: Medication reminders, refills
- `question`: Questions, inquiries
- `note`: General notes
- `lead`: Unmet needs (for partner referrals)

## Lead Generation

When CareOS can't fulfill a need, the system:
1. Detects lead opportunity
2. Creates lead record
3. Asks user for consent to share with partner
4. If YES → distributes lead, provides partner link
5. If NO → stores as "unmatched demand" for product roadmap

Partner categories:
- Caregiver hiring → Care.com
- Telehealth urgent → Teladoc
- Medical equipment → Aeroflow
- RX savings → GoodRx
- Home modifications → CAPS Network
- Meal delivery → Mom's Meals
- Insurance → Ethos
- Legal/estate → Trust & Will
- Memory care → A Place for Mom

## WhatsApp Integration

WhatsApp features:
- Image processing (prescriptions, symptoms)
- Voice note transcription
- Document handling (PDFs)
- Quick reply buttons
- Read receipts

Configure WhatsApp in Twilio Console → Messaging → WhatsApp Sandbox (or Business API).

## Testing Checklist

- [ ] SMS onboarding flow (all 5 steps)
- [ ] Language detection (test: HI, Hola, Bonjour, 你好)
- [ ] STOP keyword handling
- [ ] HELP keyword handling
- [ ] AI classification accuracy
- [ ] Lead generation consent flow
- [ ] WhatsApp message handling
- [ ] Password validation
- [ ] Email validation
- [ ] Rate limiting
- [ ] Twilio signature validation

## Deployment Checklist

- [ ] Twilio 10DLC registration (US)
- [ ] WhatsApp Business API approval
- [ ] BAA signed with Twilio (HIPAA)
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Webhook URLs configured in Twilio
- [ ] SSL certificate active
- [ ] Error monitoring (Sentry)
- [ ] Analytics tracking

## Compliance

### TCPA (Telephone Consumer Protection Act)
- ✅ Double opt-in required
- ✅ Consent records stored (never deleted)
- ✅ STOP honored immediately
- ✅ Suppression list maintained
- ✅ 10DLC registration (US)

### HIPAA (if handling PHI)
- ✅ BAA with Twilio
- ✅ Encryption at rest and in transit
- ✅ Access controls
- ✅ Audit logging

## Support

For issues and questions:
- Check Twilio logs in Console
- Check application logs
- Review database consent records
- Test webhook with Twilio's webhook tester

## Next Steps

1. Set up production Twilio account
2. Configure WhatsApp Business API
3. Integrate with partner APIs for lead distribution
4. Set up monitoring and alerting
5. Implement rate limiting
6. Add OTP verification for sensitive operations

