# BusinessOS Whitelabel Prompt for Cursor AI

> Copy and paste this entire prompt into Cursor AI to transform CareOS into a whitelabeled BusinessOS platform.

---

## PROMPT START

Transform this entire codebase from **CareOS** (healthcare-focused) to **BusinessOS** (generic business platform). This is a complete whitelabeling task that generalizes all healthcare-specific terminology to business-generic terms while maintaining all technical functionality.

---

## 1. BRANDING & NAMING

### Find & Replace (Global)
```
CareOS → BusinessOS
Care OS → Business OS
careos → businessos
care-os → business-os
CareOS Engine → BusinessOS Platform

Care.com → [remove or replace with generic partner]
Teladoc → [remove or replace with generic partner]
Aeroflow → [remove or replace with generic partner]
GoodRx → [remove or replace with generic partner]
```

### Domain & URLs
```
careos.app → businessos.app (or yourdomain.com)
support@careos.app → support@businessos.app
noreply@careos.app → noreply@businessos.app
```

### Product Messaging
```
OLD: "SMS-First Family Healthcare Coordination"
NEW: "SMS-First Business Communication Platform"

OLD: "Zero friction signup. Text 'HI' → Start using immediately."
NEW: "Zero friction onboarding. Text 'HI' → Start engaging immediately."

OLD: "family care assistant"
NEW: "business assistant"
```

---

## 2. FEATURE GENERALIZATION

### Healthcare → Business Terms

#### Core Features
```
healthcare coordination → business coordination
care coordination → business communication
health tracking → task tracking
medication reminders → reminder management
appointment tracking → appointment scheduling
family care circle → team collaboration
care reports → business reports
```

#### Categories
```
health → task | project | request
task → task (keep)
appointment → appointment (keep)
medication → product | service
question → inquiry | support
note → note (keep)
lead → lead (keep)
```

#### Lead Categories (Update in lib/leads.ts)
```
OLD LEAD CATEGORIES (Healthcare-specific):
- caregiver_hiring
- telehealth_urgent
- medical_equipment
- rx_savings
- home_modifications
- meal_delivery
- insurance
- legal_estate
- memory_care

NEW LEAD CATEGORIES (Business-generic):
- staffing_hiring
- consulting_urgent
- equipment_supply
- cost_savings
- facility_improvements
- delivery_services
- insurance_business
- legal_services
- facility_management
```

---

## 3. AI PROMPTS & SYSTEM MESSAGES

### Update Claude System Prompt (lib/anthropic.ts)

**OLD:**
```typescript
"You are CareOS, a family care assistant."
```

**NEW:**
```typescript
"You are BusinessOS, a business communication assistant that helps businesses coordinate, manage tasks, schedule appointments, and connect with vendors through SMS."
```

### Update Product Hierarchy
```typescript
// OLD
CAREOS FEATURES:
- Health tracking via text
- Medication reminders
- Family care circle (invite caregivers)
- Appointment tracking
- Task management
- Document storage (photos)
- WhatsApp support

CAREOS PREMIUM:
- Expert Connect (nurse consultations)
- Care Reports (weekly summaries)
- Calendar sync
- Unlimited family members

// NEW
BUSINESSOS FEATURES:
- Task tracking via text
- Reminder management
- Team collaboration (invite team members)
- Appointment scheduling
- Task management
- Document storage (photos)
- WhatsApp support

BUSINESSOS PREMIUM:
- Expert Connect (consultant marketplace)
- Business Reports (weekly summaries)
- Calendar sync
- Unlimited team members
```

### Update Lead Detection
```typescript
// Remove healthcare-specific lead detection
// Keep generic: equipment, services, consulting, staffing, etc.
```

---

## 4. UI COPY & MESSAGING

### Landing Page (app/page.tsx)
```typescript
OLD: "SMS-First Family Healthcare Coordination"
NEW: "SMS-First Business Communication Platform"

OLD: "Zero friction signup. Text 'HI' → Start using immediately."
NEW: "Zero friction onboarding. Text 'HI' → Start engaging immediately."

OLD: "You can now text me: • Health updates • Medication reminders • Appointments • Tasks • Questions"
NEW: "You can now text me: • Task updates • Reminders • Appointments • Projects • Questions"

OLD: "Try: 'Mom took her blood pressure: 120/80'"
NEW: "Try: 'Team meeting tomorrow at 2pm'"
```

### Onboarding Messages (lib/language.ts)
```typescript
// English
OLD: "👋 Welcome to CareOS!\n\nBy continuing, you agree to receive SMS messages for care coordination."
NEW: "👋 Welcome to BusinessOS!\n\nBy continuing, you agree to receive SMS messages for business communication."

OLD: "Join 50,000+ families organizing care by text."
NEW: "Join thousands of businesses managing operations by text."

OLD: "Track health, manage tasks, coordinate family."
NEW: "Track tasks, manage projects, coordinate teams."

// Update all languages similarly
```

### Helper Engine (app/helper-engine/page.tsx)
```typescript
OLD: "Ask me complex questions about healthcare, care coordination, or connect with verified experts for personalized help."
NEW: "Ask me anything about your business - I can help with questions, connect you with verified vendors, or search available leads and opportunities."

OLD: "Verified Experts"
NEW: "Verified Vendors"

OLD: "Connect with verified healthcare professionals"
NEW: "Connect with verified business professionals"
```

### Dashboard (app/sms-dashboard/page.tsx)
```typescript
OLD: "Your health timeline and captured items"
NEW: "Your business timeline and captured items"

OLD: "Start texting to see your health timeline!"
NEW: "Start texting to see your business timeline!"
```

---

## 5. DATABASE SCHEMA UPDATES

### Model Names (Optional - keep if you want)
```
Keep: User, Lead, Vendor, Message, etc.
These are generic enough.
```

### Field Comments & Descriptions
```prisma
// Update comments in schema.prisma
OLD: // 'health', 'task', 'appointment', 'medication', etc.
NEW: // 'task', 'project', 'appointment', 'service', etc.

OLD: // 'caregiver_hiring', 'telehealth', etc.
NEW: // 'staffing_hiring', 'consulting', etc.
```

---

## 6. PARTNER INTEGRATIONS

### Update lib/leads.ts

**Replace healthcare partners with business-generic or remove:**

```typescript
// OLD
export const LEAD_PARTNERS = {
  caregiver_hiring: { name: 'Care.com', value: 15 },
  telehealth_urgent: { name: 'Teladoc', value: 10 },
  medical_equipment: { name: 'Aeroflow', value: 25 },
  // ...
};

// NEW - Use generic categories or remove
export const LEAD_PARTNERS: Record<string, { name: string; value: number; url?: string }> = {
  staffing_hiring: {
    name: 'Staffing Partner',
    value: 15,
    url: 'https://staffing-partner.com/?ref=businessos',
  },
  consulting_urgent: {
    name: 'Consulting Services',
    value: 10,
    url: 'https://consulting-services.com/?ref=businessos',
  },
  equipment_supply: {
    name: 'Equipment Supplier',
    value: 25,
    url: 'https://equipment-supplier.com/?ref=businessos',
  },
  cost_savings: {
    name: 'Cost Savings Platform',
    value: 5,
    url: 'https://cost-savings.com/?ref=businessos',
  },
  // ... add more as needed or leave empty for clients to configure
};
```

---

## 7. DOCUMENTATION UPDATES

### README.md
```
OLD: "A secure, AI-driven SMS-first healthcare coordination platform"
NEW: "A secure, AI-driven SMS-first business communication platform"

OLD: "Family Healthcare Coordination"
NEW: "Business Communication Platform"

OLD: "care coordination"
NEW: "business communication"
```

### SMS_SETUP.md
```
OLD: "CareOS is an SMS-first healthcare coordination platform."
NEW: "BusinessOS is an SMS-first business communication platform."

OLD: "Users sign up and interact entirely via text message - no app download required."
NEW: "Businesses and users sign up and interact entirely via text message - no app download required."

OLD: "healthcare coordination"
NEW: "business communication"
```

### Update all docs similarly

---

## 8. CONFIGURATION FILES

### Environment Variables (.env.example)
```env
# Update branding
APP_NAME="BusinessOS"
APP_URL="https://businessos.app"

# Update email addresses
SUPPORT_EMAIL="support@businessos.app"
NOREPLY_EMAIL="noreply@businessos.app"
```

### Package.json
```json
{
  "name": "businessos-platform",
  "description": "SMS-First Business Communication Platform",
  ...
}
```

### next.config.js (if needed)
```javascript
// Update any branding in config
env: {
  APP_NAME: 'BusinessOS',
  APP_URL: process.env.APP_URL || 'https://businessos.app',
}
```

---

## 9. UI COMPONENTS & STYLING

### Color Scheme (Optional - update if desired)
```
Current: Blue/Violet (healthcare)
New: Keep or change to business colors (blue, green, or custom)

Update in tailwind.config.ts if needed
```

### Logo & Favicon
```
Update all logo references
Update favicon
Update app icons
```

### Brand Assets
```
app/icon.png
app/logo.svg
public/favicon.ico
public/logo.png
```

---

## 10. EXAMPLE MESSAGES & RESPONSES

### Update Sample Messages

**Onboarding:**
```
OLD: "Try: 'Mom took her blood pressure: 120/80'"
NEW: "Try: 'Team meeting scheduled for tomorrow at 2pm'"

OLD: "Track health, manage tasks, coordinate family."
NEW: "Track tasks, manage projects, coordinate teams."
```

**AI Responses:**
```
OLD: "I can help with health updates, medication reminders..."
NEW: "I can help with task updates, reminder management..."
```

---

## 11. METADATA & SEO

### app/layout.tsx
```typescript
// Update metadata
export const metadata = {
  title: 'BusinessOS - SMS-First Business Communication Platform',
  description: 'Zero-friction business communication via SMS. Manage tasks, schedule appointments, connect with vendors.',
  keywords: 'business communication, SMS platform, task management, team coordination',
}
```

### Open Graph / Twitter Cards
```typescript
openGraph: {
  title: 'BusinessOS - SMS-First Business Platform',
  description: 'Manage your business via SMS',
  url: 'https://businessos.app',
  siteName: 'BusinessOS',
}
```

---

## 12. EMAIL TEMPLATES (if any)

```
Subject: Welcome to BusinessOS
Body: "Welcome to BusinessOS! Start managing your business via SMS..."
```

---

## 13. LEGAL & COMPLIANCE

### Privacy Policy / Terms of Service
```
Update all legal documents
Replace CareOS with BusinessOS
Update healthcare-specific language
Generalize to business context
```

---

## 14. FEATURE-SPECIFIC UPDATES

### SMS Demo (app/demo/page.tsx)
```
Update example messages:
- Healthcare examples → Business examples
- "Mom took her blood pressure" → "Team meeting tomorrow"
- "Medication reminder" → "Project deadline reminder"
```

### Vendor Categories
```
OLD: 'geriatric_care', 'medication_management', 'chronic_disease'
NEW: 'business_consulting', 'project_management', 'operations_support'
```

### Onboarding Flow Messages
```
Step 1: Keep generic (already works)
Step 2: Name → Keep
Step 3: Email → Keep
Step 4: Password → Keep
Step 5: Welcome message → Update to business context
```

---

## 15. TESTING & VALIDATION

### Update Test Data
```
- Replace healthcare test cases with business cases
- Update example phone numbers if needed
- Update example messages
```

### Sample Test Messages
```
OLD: "I need help with my mom's medication schedule"
NEW: "I need help scheduling my team's weekly meetings"

OLD: "Can you remind me about the doctor appointment?"
NEW: "Can you remind me about the client meeting?"
```

---

## 16. FILE-LEVEL CHANGES

### Files to Update Completely:
```
- README.md
- SMS_SETUP.md
- SMS_PLATFORM_SUMMARY.md
- ARCHITECTURE.md (if healthcare-specific)
- app/page.tsx (landing page)
- app/demo/page.tsx
- app/helper-engine/page.tsx
- app/sms-dashboard/page.tsx
- lib/anthropic.ts (AI prompts)
- lib/language.ts (messages)
- lib/leads.ts (partner categories)
- components/careos-unified.tsx (if exists)
- All API route files with messages
```

### Files to Review:
```
- package.json
- next.config.js
- tailwind.config.ts
- All component files
```

---

## 17. SYSTEMATIC REPLACEMENT CHECKLIST

### Step 1: Global Find/Replace
```
✅ CareOS → BusinessOS (case-sensitive, all variations)
✅ careos → businessos (lowercase)
✅ Care OS → Business OS
✅ care coordination → business communication
✅ healthcare → business (context-dependent)
✅ family care → team collaboration
✅ health tracking → task tracking
✅ medication → product/service/reminder
✅ caregiver → team member/employee
```

### Step 2: Update Branding Assets
```
✅ Logo files
✅ Favicon
✅ App icons
✅ Email templates
```

### Step 3: Update Configuration
```
✅ Environment variables
✅ App metadata
✅ Package.json
✅ Config files
```

### Step 4: Update Documentation
```
✅ README.md
✅ All .md files
✅ Inline comments
✅ Code comments
```

### Step 5: Update AI Prompts
```
✅ Claude system prompts
✅ Message templates
✅ Response examples
```

### Step 6: Update Partner Integrations
```
✅ Lead categories
✅ Partner names
✅ Partner URLs
```

### Step 7: Update UI Copy
```
✅ Landing page
✅ Onboarding messages
✅ Dashboard text
✅ Helper Engine
✅ All user-facing text
```

---

## 18. VALIDATION COMMANDS

After whitelabeling, run these to verify:

```bash
# Check for remaining CareOS references
grep -r "CareOS" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next

# Check for remaining healthcare-specific terms
grep -r "healthcare\|medication\|caregiver\|health tracking" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next

# Build and test
npm run build
npm run dev
```

---

## 19. WHITELABEL FEATURES TO PRESERVE

**Keep these exactly as-is (already generic):**
- ✅ SMS/WhatsApp infrastructure
- ✅ Voice fallback system
- ✅ RCS support
- ✅ Deep links
- ✅ Multi-language AI
- ✅ A/B testing framework
- ✅ Geographic matching
- ✅ Vendor marketplace
- ✅ Lead generation
- ✅ Calendar integration
- ✅ All technical features

**Only update:**
- Branding (CareOS → BusinessOS)
- Messaging/copy
- Healthcare-specific terminology
- Partner categories
- Example messages

---

## 20. CUSTOMIZATION POINTS FOR CLIENTS

Make these easily configurable:
```env
APP_NAME="BusinessOS"  # Clients can change this
APP_URL="https://businessos.app"
BRAND_COLOR_PRIMARY="#3B82F6"  # Clients can customize
BRAND_COLOR_SECONDARY="#8B5CF6"
SUPPORT_EMAIL="support@businessos.app"
```

---

## OUTPUT REQUIREMENTS

1. ✅ All files updated with BusinessOS branding
2. ✅ All healthcare terms generalized
3. ✅ All documentation updated
4. ✅ All UI copy updated
5. ✅ All AI prompts generalized
6. ✅ All partner categories updated
7. ✅ Build passes successfully
8. ✅ No remaining CareOS references (except in git history)

---

## TESTING AFTER WHITELABELING

1. **Build Test:**
   ```bash
   npm run build
   ```

2. **Dev Server:**
   ```bash
   npm run dev
   ```

3. **Check Pages:**
   - Landing page (/) - verify BusinessOS branding
   - Demo page (/demo) - verify generic examples
   - Dashboard (/sms-dashboard) - verify generic terminology
   - Helper Engine (/helper-engine) - verify business context
   - Vendor Dashboard (/vendor/dashboard) - verify generic categories

4. **Check SMS Flow:**
   - Test onboarding: text "HI"
   - Verify messages use BusinessOS branding
   - Verify generic example messages

5. **Check AI Responses:**
   - Send test message
   - Verify AI responds with business context
   - Verify no healthcare-specific references

---

## PROMPT END

---

## USAGE INSTRUCTIONS

1. Copy everything between "PROMPT START" and "PROMPT END"
2. Paste into Cursor AI chat
3. Say: "Execute this whitelabeling transformation completely"
4. Cursor will systematically update all files
5. Review changes and test
6. Commit with message: "Whitelabel CareOS to BusinessOS"

For incremental whitelabeling:
- Phase 1: Global find/replace (CareOS → BusinessOS)
- Phase 2: Update AI prompts and messages
- Phase 3: Update UI components
- Phase 4: Update documentation
- Phase 5: Update partner categories
- Phase 6: Final validation and testing

---

## POST-WHITELABEL CUSTOMIZATION GUIDE

After whitelabeling, clients can customize:

1. **Branding:**
   - App name (BusinessOS → ClientName)
   - Colors (tailwind.config.ts)
   - Logo (public/logo.png)

2. **Domain:**
   - Update BASE_URL
   - Update email addresses
   - Update callback URLs

3. **Partner Integrations:**
   - Update lib/leads.ts with client's partners
   - Configure lead categories for their business

4. **Messaging:**
   - Customize onboarding messages
   - Update AI prompts for their industry
   - Configure example messages

---

**This prompt ensures a complete, production-ready whitelabel transformation while preserving all technical functionality.**


