# CareOS Engine

A secure, AI-driven SMS-first healthcare coordination platform built with Next.js, NextAuth, PostgreSQL, Twilio, and Claude AI.

## Features

### Authentication & Security
- ✅ Email/password login with password visibility toggle
- ✅ Password reset/recovery flow (API ready)
- ✅ Multi-factor authentication (MFA) with TOTP
- ✅ Session management (view/revoke active sessions)
- ✅ Login history and activity log
- ✅ Google OAuth sign-in

### Profile Management
- ✅ Profile photo upload
- ✅ Display name and basic info editing
- ✅ Email change with verification (API ready)
- ✅ Phone number (optional, for recovery/MFA)

### Privacy & Data
- ✅ Privacy settings (visibility controls)
- ✅ Data export (GDPR-compliant JSON export)
- ✅ Account deletion flow
- ✅ Cookie/tracking preferences

### Notifications
- ✅ Email notification preferences (marketing, transactional, updates)
- ✅ Push notification settings (UI ready)
- ✅ In-app notification preferences

### Billing & Subscription
- ✅ Subscription tier management
- ✅ Invoice history
- ✅ Upgrade/downgrade options (UI ready)

### Accessibility & Preferences
- ✅ Theme toggle (light/dark/system mode)
- ✅ Language selection
- ✅ Timezone setting

### SMS-First Healthcare Platform
- ✅ SMS onboarding flow (5-step, TCPA compliant)
- ✅ WhatsApp integration with media support
- ✅ AI message classification (Claude API)
- ✅ Multi-language support (8+ languages)
- ✅ Lead generation engine with partner referrals
- ✅ Health timeline and captured items dashboard
- ✅ Mandatory keyword handling (STOP, HELP, START)
- ✅ International support (180+ countries)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **SMS/WhatsApp**: Twilio
- **AI**: Claude API (Anthropic)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Testing**: Jest, React Testing Library
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CareOS-Engine
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/careos"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Twilio SMS Platform
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="+1234567890"
TWILIO_MESSAGING_SERVICE_SID="your-messaging-service-sid"

# Anthropic (Claude API)
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Security
PHONE_HASH_SALT="generate-random-salt-for-phone-hashing"

# App
BASE_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
CareOS-Engine/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── settings/          # Settings pages
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── errors.ts         # Error handling architecture
│   ├── prisma.ts         # Prisma client
│   └── api/              # API utilities
├── prisma/               # Database schema and migrations
├── tests/                # Test files
└── public/               # Static assets
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Security Features

- **Centralized Error Handling**: Domain-specific error codes with boundary translation
- **Input Validation**: Zod schemas for all inputs
- **Password Security**: bcrypt hashing with 12 rounds
- **MFA Support**: TOTP-based multi-factor authentication
- **Session Management**: Secure JWT-based sessions
- **Audit Logging**: Login history and error tracking

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Watch mode:
```bash
npm run test:watch
```

## CI/CD

The project includes GitHub Actions workflows for:
- Automated testing
- Security scanning (Snyk, npm audit)
- Build verification

See `.github/workflows/ci.yml` for details.

## Security Tools

### SAST (Static Application Security Testing)
- **ESLint**: Code quality and security linting
- **Snyk**: Dependency vulnerability scanning
- **npm audit**: Package vulnerability checks

### DAST (Dynamic Application Security Testing)
- Manual testing recommended
- Consider OWASP ZAP or Burp Suite for production

### RASP (Runtime Application Self-Protection)
- Consider services like:
  - **Sqreen**: Runtime protection and monitoring
  - **Contrast Security**: Application security platform
  - **Imperva**: Web application firewall

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/careos"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Email (Optional, for production)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASSWORD="password"
```

## Database Migrations

Create a new migration:
```bash
npx prisma migrate dev --name migration-name
```

Apply migrations in production:
```bash
npx prisma migrate deploy
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t careos-engine .
docker run -p 3000:3000 careos-engine
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.

