# Profile Sharing Feature

## Overview

The Profile Sharing feature allows CareOS users to share their health profile with family members, friends, and medical teams through secure deep links. Medical teams can log notes and upload pertinent files, with complete audit trails tracking all access and modifications.

## Features

### 1. **Share Link Generation**
- Users can create share links with different permission levels:
  - **Family**: View-only access for family members
  - **Friend**: View-only access for friends
  - **Medical Team**: Full access with ability to log notes and upload files
  - **Public**: Public access (use with caution)
- Each share link has:
  - Unique token for deep linking
  - Optional expiration date
  - Configurable permissions (notes, files, view-only)
  - Title and description

### 2. **Deep Link Support**
- **Mobile Apps**: `careos://profile/{token}` opens in native app
- **Web**: `https://careos.app/profile/{token}` opens in browser
- Universal links work across all platforms

### 3. **Access Management**
- Invite users by email or user ID
- Track who has access to each shared profile
- View access history (when accessed, last accessed)
- Revoke access at any time
- Support for unregistered users (email-based access)

### 4. **Medical Team Features**
- **Log Notes**: Medical professionals can add notes with:
  - Title and content
  - Category (medical, general, medication, appointment, etc.)
  - Tags for organization
  - Private/public visibility
- **Upload Files**: Medical teams can upload:
  - Lab results
  - Prescriptions
  - X-rays and medical images
  - Medical records
  - PDFs and documents
- Files support:
  - Up to 10MB per file
  - Multiple file types (images, PDFs, documents)
  - Categories and tags
  - Private/public visibility

### 5. **Complete Audit Trail**
- **Access Logs**: Track every time someone views the profile
  - Who accessed (user ID, email)
  - When accessed (timestamp)
  - IP address and user agent
  - Action type (view, download, note_added, file_uploaded)
- **Audit Logs**: Track all modifications
  - Who made the change
  - What changed (note added, file uploaded, access granted/revoked)
  - Old and new values
  - Timestamp and metadata
- Profile owners can view complete audit history

## Database Schema

### Models

1. **ProfileShare**: Share link configuration
   - `shareToken`: Unique token for deep link
   - `shareType`: family, friend, medical_team, public
   - `allowNotes`, `allowFiles`, `allowViewOnly`: Permissions
   - `expiresAt`: Optional expiration

2. **ProfileAccess**: Who has access
   - `userId` or `email`: Invitee identifier
   - `role`: family, friend, medical_professional, viewer
   - `organization`, `licenseNumber`: For medical professionals
   - `invitedAt`, `acceptedAt`, `lastAccessedAt`: Timestamps

3. **ProfileAccessLog**: Access history
   - Every profile view/action
   - IP address, user agent
   - Action type

4. **ProfileNote**: Medical notes
   - Title, content, category, tags
   - Private/public visibility
   - Who created it and when

5. **ProfileFile**: Uploaded files
   - File metadata (name, type, size, URL)
   - Category and tags
   - Private/public visibility
   - Who uploaded and when

6. **ProfileAuditLog**: Complete audit trail
   - All changes to notes, files, access
   - Old/new values
   - Full context

## API Endpoints

### Share Management
- `POST /api/profile/share` - Create new share link
- `GET /api/profile/shares` - List user's share links
- `GET /api/profile/[token]` - View shared profile
- `GET /api/profile/[token]/access` - List people with access
- `POST /api/profile/[token]/access` - Add access
- `DELETE /api/profile/[token]/access/[accessId]` - Revoke access

### Medical Team Actions
- `POST /api/profile/[token]/notes` - Add note
- `POST /api/profile/[token]/files` - Upload file

### Audit & Logging
- `GET /api/profile/[token]/audit` - Get audit log (profile owner only)

## UI Pages

### 1. Profile Share Management (`/profile/share`)
- Create new share links
- View all share links
- Manage access lists
- Copy share links
- View access history

### 2. Shared Profile View (`/profile/[token]`)
- View profile information
- View health timeline (captured items)
- View medical notes (if allowed)
- View uploaded files (if allowed)
- Add notes (medical teams only)
- Upload files (medical teams only)

## Security Features

1. **Access Control**
   - Only invited users can access shared profiles
   - Medical team features require proper role
   - View-only mode for family/friends

2. **Audit Trail**
   - Every access is logged
   - Every modification is tracked
   - IP addresses and user agents recorded

3. **File Security**
   - Files stored in `public/uploads/profile-files/`
   - 10MB file size limit
   - MIME type validation

4. **Token Security**
   - Cryptographically secure random tokens
   - Base64url encoding for URL safety
   - Optional expiration dates

## Usage Examples

### Creating a Share Link

```typescript
const response = await fetch('/api/profile/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shareType: 'medical_team',
    title: 'Share with Dr. Smith',
    description: 'Full access for medical team',
    allowNotes: true,
    allowFiles: true,
    allowViewOnly: false,
  }),
});
```

### Adding Access

```typescript
const response = await fetch(`/api/profile/${token}/access`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'doctor@example.com',
    name: 'Dr. Smith',
    role: 'medical_professional',
    organization: 'City Hospital',
    licenseNumber: 'MD12345',
  }),
});
```

### Adding a Note

```typescript
const response = await fetch(`/api/profile/${token}/notes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Follow-up appointment',
    content: 'Patient should return in 2 weeks for follow-up.',
    category: 'appointment',
    tags: ['follow-up', 'urgent'],
    isPrivate: false,
  }),
});
```

## Deep Link Format

- **Mobile (iOS/Android)**: `careos://profile/{token}`
- **Web**: `https://careos.app/profile/{token}`
- **Universal**: Works on all platforms, automatically redirects

## Next Steps

1. **Run Database Migration**:
   ```bash
   npx prisma migrate dev --name add_profile_sharing
   ```

2. **Test the Feature**:
   - Create a share link
   - Invite a test user
   - Add notes and files
   - View audit logs

3. **Production Considerations**:
   - Set up file storage (S3, Cloudinary, etc.) for production
   - Configure file size limits
   - Set up monitoring for access logs
   - Consider rate limiting for file uploads

## Files Created

### Database
- `prisma/schema.prisma` - Added 6 new models

### Utilities
- `lib/profile-sharing.ts` - Profile sharing utilities
- `lib/deep-links.ts` - Extended with profile share links

### API Routes
- `app/api/profile/share/route.ts` - Create share
- `app/api/profile/shares/route.ts` - List shares
- `app/api/profile/[token]/route.ts` - View shared profile
- `app/api/profile/[token]/access/route.ts` - Manage access
- `app/api/profile/[token]/access/[accessId]/route.ts` - Revoke access
- `app/api/profile/[token]/notes/route.ts` - Add notes
- `app/api/profile/[token]/files/route.ts` - Upload files
- `app/api/profile/[token]/audit/route.ts` - Audit logs

### UI Pages
- `app/profile/share/page.tsx` - Share management page
- `app/profile/[token]/page.tsx` - Shared profile view

