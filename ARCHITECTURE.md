# CareOS Engine - Architecture Document

## System Overview

### What the System Does

CareOS Engine is a secure, AI-driven user management and authentication system built with Next.js, NextAuth, and PostgreSQL. It provides comprehensive user account management, authentication, authorization, and settings management capabilities.

### Business / Product Purpose

The system serves as a foundation for building secure, scalable applications that require:
- Robust user authentication and authorization
- Multi-factor authentication (MFA)
- Comprehensive user profile and settings management
- Privacy and data protection compliance (GDPR-ready)
- Subscription and billing management
- Audit trails and security monitoring

### High-Level Description

The system operates as a full-stack Next.js application with:
- **Frontend**: React components with Tailwind CSS, server and client components
- **Backend**: Next.js API routes with NextAuth for authentication
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth with credentials and OAuth (Google) providers
- **Error Handling**: Centralized error handling architecture with domain-specific error codes

## Core Components & Responsibilities

### 1. Authentication Layer (`lib/auth.ts`, `app/api/auth/`)

**Responsibility**: Handles all authentication flows including:
- Email/password authentication
- OAuth authentication (Google)
- Multi-factor authentication (MFA) with TOTP
- Session management
- Login history tracking

**Interactions**:
- Uses Prisma to query/update User and Session models
- Integrates with NextAuth for session management
- Logs authentication events to LoginHistory

### 2. Error Handling Architecture (`lib/errors.ts`, `lib/api/error-handler.ts`)

**Responsibility**: Provides centralized, consistent error handling:
- Domain-specific error codes and categories
- Boundary translation (domain errors → HTTP responses)
- Single choke point for all API error handling
- Auditability through request IDs and error logging

**Interactions**:
- All API routes use `withErrorHandling` wrapper
- Errors are logged with request context
- Client receives structured error responses

### 3. Database Layer (`prisma/schema.prisma`, `lib/prisma.ts`)

**Responsibility**: Data persistence and schema management:
- User accounts and authentication data
- Sessions and login history
- User preferences and settings
- Notifications and privacy settings
- Subscriptions and billing

**Models**:
- `User`: Core user account data
- `Account`: OAuth account linkages
- `Session`: Active user sessions
- `LoginHistory`: Authentication audit trail
- `NotificationSettings`: User notification preferences
- `PrivacySettings`: Privacy and data sharing preferences
- `Subscription`: Billing and subscription management
- `Invoice`: Payment history

### 4. Settings Management (`app/settings/`, `components/`)

**Responsibility**: User-facing settings interfaces:
- Profile management (name, photo, phone)
- Security settings (password, email, MFA, sessions)
- Notification preferences
- Privacy settings and data management
- Billing and subscription management
- Application preferences (theme, language, timezone)

**Interactions**:
- Reads/writes to database via API routes
- Updates user session when profile changes
- Handles file uploads for profile photos

### 5. API Routes (`app/api/`)

**Responsibility**: RESTful API endpoints:
- `/api/auth/signup`: User registration
- `/api/auth/[...nextauth]`: NextAuth endpoints
- `/api/settings/*`: Settings CRUD operations
- `/api/mfa/*`: MFA setup and verification
- `/api/sessions/*`: Session management

**Interactions**:
- All routes use error handling wrapper
- Require authentication via `requireAuth`
- Validate input with Zod schemas
- Return structured responses

## Data Flow & Control Flow

### Request Lifecycle

```
1. User Request
   ↓
2. Next.js Middleware (if applicable)
   ↓
3. Route Handler / Page Component
   ↓
4. Authentication Check (getServerSession / requireAuth)
   ↓
5. Input Validation (Zod schemas)
   ↓
6. Business Logic (Prisma queries/mutations)
   ↓
7. Error Handling (withErrorHandling wrapper)
   ↓
8. Response (JSON or HTML)
```

### Authentication Flow

```
1. User submits credentials
   ↓
2. CredentialsProvider.authorize()
   ↓
3. Verify password (bcrypt)
   ↓
4. Check MFA if enabled
   ↓
5. Create/update session
   ↓
6. Log login attempt (LoginHistory)
   ↓
7. Return session token
```

### Error Handling Flow

```
1. Error occurs in handler
   ↓
2. Caught by withErrorHandling wrapper
   ↓
3. handleApiError() processes error
   ↓
4. Log error with request context
   ↓
5. Convert to DomainError
   ↓
6. Return HTTP response with error structure
```

## Infrastructure & Runtime Environment

### Runtime Assumptions

- **Node.js**: Version 20+
- **Database**: PostgreSQL 15+
- **Deployment**: Vercel, AWS, or containerized (Docker)
- **Environment**: Development, staging, production

### Storage Systems

- **PostgreSQL**: Primary database for all persistent data
- **File System**: Profile image uploads (stored in `public/uploads/`)
- **Session Storage**: JWT tokens (stateless) or database sessions

### External Services

- **NextAuth**: Authentication framework
- **Google OAuth**: Social login provider (optional)
- **Stripe**: Payment processing (configured but not fully integrated)
- **Email Service**: Nodemailer configured (requires SMTP setup)

### APIs

- Next.js API Routes (internal)
- NextAuth API endpoints
- Prisma Client (database access)

## Key Design Decisions

### 1. Centralized Error Handling

**Decision**: Single error handling architecture with domain errors and boundary translation.

**Rationale**: 
- Ensures consistent error responses across all endpoints
- Makes errors auditable and traceable
- Prevents ad-hoc error handling that can lead to security issues
- Aligns with "Contracts Everywhere" principle

### 2. Prisma ORM

**Decision**: Use Prisma for database access instead of raw SQL.

**Rationale**:
- Type-safe database queries
- Automatic migrations
- Better developer experience
- Reduces SQL injection risks

### 3. NextAuth for Authentication

**Decision**: Use NextAuth instead of custom auth implementation.

**Rationale**:
- Battle-tested security
- Built-in OAuth support
- Session management
- Reduces security vulnerabilities from custom implementations

### 4. Server and Client Components

**Decision**: Use Next.js 14 App Router with server/client component separation.

**Rationale**:
- Better performance (server components reduce client bundle)
- Improved security (sensitive logic on server)
- Better SEO
- Modern React patterns

### 5. Zod for Validation

**Decision**: Use Zod for input validation.

**Rationale**:
- Type-safe validation
- Reusable schemas
- Clear error messages
- Prevents invalid data from reaching business logic

## Scalability & Reliability Considerations

### Current Scaling Model

- **Stateless API**: JWT-based sessions allow horizontal scaling
- **Database**: Single PostgreSQL instance (can be scaled with read replicas)
- **File Storage**: Local filesystem (should migrate to S3/Cloud Storage for production)

### Bottlenecks and Risk Areas

1. **Database Connections**: Prisma connection pooling handles this, but monitor under load
2. **File Uploads**: Local storage doesn't scale; needs cloud storage migration
3. **Session Management**: JWT is stateless, but session revocation requires database queries
4. **MFA Setup**: QR code generation is synchronous; could be optimized

### Reliability Measures

- **Error Handling**: Comprehensive error handling prevents crashes
- **Input Validation**: Zod schemas prevent invalid data
- **Database Transactions**: Prisma handles transactions for data consistency
- **Audit Logging**: Login history provides security audit trail

## Security Model

### Authentication & Authorization

- **Password Hashing**: bcrypt with 12 rounds
- **Session Management**: JWT tokens with configurable expiration
- **MFA**: TOTP-based (Google Authenticator compatible)
- **OAuth**: Google OAuth for social login

### Secrets Handling

- **Environment Variables**: All secrets in `.env` (never committed)
- **NextAuth Secret**: Required for JWT signing
- **Database URL**: Encrypted in production
- **OAuth Credentials**: Stored in environment variables

### Boundaries of Trust

- **API Routes**: All require authentication (except signup/signin)
- **Server Components**: Trusted (run on server)
- **Client Components**: Untrusted (validate all inputs)
- **Database**: Trusted (internal network only)

### Data Protection

- **Password Storage**: Hashed, never plaintext
- **MFA Secrets**: Encrypted in database
- **PII**: Stored securely, exportable for GDPR compliance
- **Session Data**: Minimal data in JWT tokens

## Observability & Operations

### Logging

- **Error Logging**: All errors logged with request context and request IDs
- **Authentication Events**: Login attempts logged to LoginHistory
- **API Errors**: Structured error responses with codes

### Metrics

- **Login History**: Tracks successful/failed login attempts
- **Session Activity**: Last active timestamps
- **Error Rates**: Can be monitored via error logs

### Monitoring

- **Database**: Monitor connection pool and query performance
- **API Routes**: Monitor response times and error rates
- **Authentication**: Monitor failed login attempts for security

### Debugging

- **Request IDs**: Every error includes request ID for tracing
- **Structured Logs**: JSON-formatted logs for parsing
- **Development Mode**: Detailed error messages in development

## Future Improvement Opportunities

### Technical Debt

1. **File Storage**: Migrate from local filesystem to cloud storage (S3, Cloudinary)
2. **Email Service**: Integrate with SendGrid/AWS SES for production emails
3. **Stripe Integration**: Complete payment processing implementation
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Caching**: Add Redis for session caching and rate limiting

### Clear Next Steps

1. **Production Hardening**:
   - Set up proper email service
   - Migrate file storage to cloud
   - Configure production database
   - Set up monitoring and alerting

2. **Security Enhancements**:
   - Implement rate limiting
   - Add CAPTCHA for signup/login
   - Add account lockout after failed attempts
   - Implement password strength requirements

3. **Feature Completeness**:
   - Complete Stripe integration
   - Add email verification flow
   - Add phone verification flow
   - Implement notification system

4. **Testing**:
   - Increase test coverage
   - Add integration tests
   - Add E2E tests with Playwright
   - Add load testing

5. **Documentation**:
   - API documentation (OpenAPI/Swagger)
   - Deployment guides
   - Developer onboarding docs

## Unknown / Missing Information

The following aspects are not fully implemented or require configuration:

- **Email Service**: Nodemailer configured but requires SMTP credentials
- **Stripe Integration**: Models exist but payment processing not fully implemented
- **Production Deployment**: No deployment configuration included
- **Monitoring**: No APM or monitoring service integrated
- **Backup Strategy**: Database backup strategy not defined
- **Disaster Recovery**: Recovery procedures not documented

