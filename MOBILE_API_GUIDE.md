# CareOS Mobile API Guide

> Complete guide for integrating CareOS APIs with iOS, Android, and React Native apps.

---

## Overview

CareOS APIs are fully compatible with mobile applications (iOS, Android, React Native, Flutter). This guide covers authentication, API endpoints, error handling, and best practices.

---

## Base Configuration

### Base URL

- **Production:** `https://api.careos.app` (or `https://careos.app/api`)
- **Development:** `http://localhost:3000/api`
- **Staging:** `https://staging.careos.app/api`

### API Version

All endpoints are versionless (latest stable). If breaking changes are introduced, they'll be announced with deprecation notices.

---

## Authentication

### NextAuth Session Token

For authenticated endpoints, use the NextAuth session token from cookies.

**iOS (Swift):**
```swift
import Foundation

func makeAuthenticatedRequest(url: URL, sessionToken: String) async throws -> Data {
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(sessionToken)", forHTTPHeaderField: "Authorization")
    
    // Include cookies if using cookie-based auth
    request.setValue("next-auth.session-token=\(sessionToken)", forHTTPHeaderField: "Cookie")
    
    let (data, _) = try await URLSession.shared.data(for: request)
    return data
}
```

**Android (Kotlin):**
```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

fun makeAuthenticatedRequest(url: String, sessionToken: String): Call {
    val client = OkHttpClient()
    val requestBody = "{}".toRequestBody("application/json".toMediaType())
    
    val request = Request.Builder()
        .url(url)
        .post(requestBody)
        .addHeader("Authorization", "Bearer $sessionToken")
        .addHeader("Cookie", "next-auth.session-token=$sessionToken")
        .build()
    
    return client.newCall(request)
}
```

**React Native:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const sessionToken = await AsyncStorage.getItem('next-auth.session-token');
  
  const response = await fetch(`https://api.careos.app${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
      'Cookie': `next-auth.session-token=${sessionToken}`,
      ...options.headers,
    },
    credentials: 'include', // Important for cookies
  });
  
  return response.json();
}
```

---

## API Endpoints

### 1. Authentication

#### Sign In
```
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "mfaCode": "123456" // Optional if MFA enabled
}
```

#### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Sign Out
```
POST /api/auth/signout
Cookie: next-auth.session-token=...
```

---

### 2. User Profile

#### Get Profile
```
GET /api/settings/profile
Authorization: Bearer <token>
Cookie: next-auth.session-token=<token>
```

#### Update Profile
```
PATCH /api/settings/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Doe",
  "phone": "+1234567890",
  "language": "en"
}
```

---

### 3. SMS & Messages

#### Get Messages
```
GET /api/sms/messages?page=1&limit=20
Authorization: Bearer <token>
```

#### Send SMS (via CareOS)
```
POST /api/sms/send
Content-Type: application/json
Authorization: Bearer <token>

{
  "to": "+1234567890",
  "body": "Hello from CareOS app"
}
```

**Note:** For production, use Twilio webhooks. This endpoint is for testing.

---

### 4. Helper Engine

#### Search Leads
```
GET /api/helper-engine/leads?query=wheelchair&country=NG&maxBudget=50
Authorization: Bearer <token>
```

#### Get Vendors
```
GET /api/helper-engine/vendors?category=caregiver_hiring&city=Lagos
Authorization: Bearer <token>
```

---

### 5. Vendor Dashboard

#### Get Vendor Profile
```
GET /api/vendor/profile
Authorization: Bearer <token>
```

#### Get Vendor Leads
```
GET /api/vendor/leads?status=pending&page=1
Authorization: Bearer <token>
```

#### Accept Lead
```
POST /api/vendor/leads/{leadId}/accept
Content-Type: application/json
Authorization: Bearer <token>

{
  "calendarUrl": "https://calendly.com/vendor/meeting"
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "requestId": "req_1234567890_abc123",
  "details": {} // Optional additional details
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Rate Limiting

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

**Rate Limits:**
- **Auth endpoints:** 5 requests/minute per IP
- **API endpoints:** 60 requests/minute per user
- **Partner API:** 100 requests/minute per partner
- **SMS webhook:** 1000 requests/minute (Twilio IPs)

---

## CORS Configuration

CareOS supports CORS for mobile apps. The following origins are allowed:

- `careos://` (iOS/Android custom scheme)
- `com.careos.app://` (Android deep link)
- `https://careos.app` (Web app)
- `http://localhost:3000` (Development)

**CORS Headers:**
```
Access-Control-Allow-Origin: <your-origin>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Platform
Access-Control-Allow-Credentials: true
```

---

## Deep Linking

### iOS Deep Links

Add to `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>careos</string>
    </array>
  </dict>
</array>
```

Handle in app:
```swift
func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    
    if url.scheme == "careos" {
        // Handle deep link
        if url.host == "lead" {
            let leadId = url.pathComponents.last
            // Navigate to lead detail
        }
    }
}
```

### Android Deep Links

Add to `AndroidManifest.xml`:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="careos"
        android:host="lead" />
</intent-filter>
```

Handle in activity:
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    val data = intent.data
    if (data?.scheme == "careos" && data.host == "lead") {
        val leadId = data.lastPathSegment
        // Navigate to lead detail
    }
}
```

### React Native Deep Linking

```typescript
import { Linking } from 'react-native';

Linking.addEventListener('url', (event) => {
  const url = new URL(event.url);
  
  if (url.protocol === 'careos:') {
    if (url.hostname === 'lead') {
      const leadId = url.pathname.split('/').pop();
      // Navigate to lead detail
    }
  }
});

// Open deep link
Linking.openURL('careos://lead/abc123');
```

---

## Push Notifications

### iOS (APNs)

CareOS supports push notifications via FCM or APNs. Configure in app settings:

```
POST /api/settings/notifications
{
  "pushEnabled": true,
  "pushToken": "apns_token_here",
  "platform": "ios"
}
```

### Android (FCM)

```
POST /api/settings/notifications
{
  "pushEnabled": true,
  "pushToken": "fcm_token_here",
  "platform": "android"
}
```

---

## Best Practices

### 1. Token Management

- Store tokens securely (Keychain on iOS, EncryptedSharedPreferences on Android)
- Refresh tokens before expiry
- Handle token expiry gracefully

### 2. Offline Support

- Cache frequently accessed data
- Queue API requests when offline
- Sync when connection restored

### 3. Error Retry

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Don't retry on 4xx errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      // Retry on 429, 500, 502, 503, 504
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 4. Request ID Tracking

Always include request ID in logs:

```typescript
const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

fetch(url, {
  headers: {
    'X-Request-ID': requestId,
  },
});
```

---

## Testing

### Test Endpoints

Use development server for testing:

```
http://localhost:3000/api
```

### Test Authentication

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Sign in (save cookie)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Use cookie for authenticated requests
curl http://localhost:3000/api/settings/profile \
  -b cookies.txt
```

---

## SDK Examples

### Swift SDK (iOS)

```swift
class CareOSClient {
    let baseURL = "https://api.careos.app"
    var sessionToken: String?
    
    func signIn(email: String, password: String) async throws {
        let url = URL(string: "\(baseURL)/api/auth/signin")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw CareOSError.authenticationFailed
        }
        
        // Extract session token from cookies
        if let cookies = HTTPCookieStorage.shared.cookies(for: url) {
            sessionToken = cookies.first(where: { $0.name == "next-auth.session-token" })?.value
        }
    }
}
```

### Kotlin SDK (Android)

```kotlin
class CareOSClient(private val baseURL: String = "https://api.careos.app") {
    private var sessionToken: String? = null
    private val client = OkHttpClient()
    
    suspend fun signIn(email: String, password: String) {
        val requestBody = json {
            "email" to email
            "password" to password
        }.toString().toRequestBody("application/json".toMediaType())
        
        val request = Request.Builder()
            .url("$baseURL/api/auth/signin")
            .post(requestBody)
            .build()
        
        val response = client.newCall(request).execute()
        
        if (response.isSuccessful) {
            // Extract session token from cookies
            response.headers("Set-Cookie").firstOrNull { 
                it.startsWith("next-auth.session-token=") 
            }?.let {
                sessionToken = it.split("=")[1].split(";")[0]
            }
        }
    }
}
```

---

## Support

For API support:
- **Email:** api-support@careos.app
- **Documentation:** https://docs.careos.app
- **Status:** https://status.careos.app

---

**Last Updated:** January 2025

