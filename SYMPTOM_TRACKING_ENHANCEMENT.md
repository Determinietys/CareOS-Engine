# Symptom Tracking & Pattern Detection Enhancement

## Overview

CareOS now includes **comprehensive symptom logging** and **pattern detection** that tracks when users report symptoms to identify if they're part of a larger recurring issue. Every symptom is logged in the user's profile with confirmation, and patterns are automatically detected.

## Key Features

### 1. **Automatic Symptom Logging**

Every symptom reported is automatically logged in the user's profile with:
- Symptom details and context
- Health correlations (if any)
- Pattern detection results
- Suggested checks and actions
- Timestamp for tracking

### 2. **Pattern Detection**

The system automatically detects if symptoms are recurring:
- **Frequency tracking**: How often symptoms occur
- **Pattern identification**: Daily, weekly, or monthly patterns
- **Related symptom detection**: Other symptoms that occur together
- **Severity tracking**: Average severity of recurring symptoms

### 3. **User Confirmation**

Every response includes:
- **Confirmation**: "This has been noted in your profile for tracking"
- **Empathetic closing**: "Feel better!" (or equivalent in user's language)
- **Pattern information**: If a pattern is detected, explains it

## Example Response

**User says**: "I have diarrhea"

**AI Response**:
> "Given your IBS, this could be a flare-up triggered by certain foods. What did you eat recently? Consider tracking your food intake to identify patterns and avoid trigger foods. 
> 
> **⚠️ Pattern detected**: You've reported this symptom 3 times recently. It may be part of a larger pattern.
> 
> **This has been noted in your profile for tracking to help identify any patterns over time. Feel better!**"

## Pattern Detection Examples

### Example 1: Recurring Headaches

**Pattern detected**:
- Symptom: Headache
- Frequency: 4 times in 7 days
- Pattern: Daily recurrence
- Related symptoms: Nausea, fatigue

**Response includes**:
> "⚠️ Pattern detected: This symptom appears to be recurring frequently (4 times in 7 days). It may be part of an ongoing issue. Consider tracking when symptoms occur and what triggers them."

### Example 2: Digestive Issues Pattern

**Pattern detected**:
- Symptom: Stomach pain
- Frequency: 2 times per week over 3 weeks
- Pattern: Weekly recurrence
- Related symptoms: Bloating, gas

**Response includes**:
> "⚠️ Pattern detected: This symptom has occurred multiple times recently. There may be a recurring pattern or trigger. Keep a detailed log of when symptoms occur and what you were doing/eating before."

## How It Works

### 1. Symptom Detection

When a user reports a symptom:
- System detects health-related keywords
- Retrieves user's health history (last 30 days)
- Analyzes patterns (last 90 days)

### 2. Pattern Analysis

The system:
- Looks for similar symptoms in history
- Calculates frequency (how often they occur)
- Identifies patterns (daily, weekly, monthly)
- Detects related symptoms that occur together
- Determines if it's part of a larger issue

### 3. Response Generation

The AI:
- Correlates current symptom with history
- Detects patterns if recurring
- Suggests relevant checks and actions
- **Confirms logging**: "This has been noted in your profile"
- **Closes empathetically**: "Feel better!"

### 4. Database Logging

Every symptom is saved with:
- Full symptom details
- Correlations found
- Pattern information (if detected)
- Suggested checks and actions
- Timestamp for tracking
- Flag that it's logged for pattern tracking

## Response Format

Every health-related response now includes:

1. **Contextual correlation** (if applicable)
   - Links symptom to history
   - Explains possible connections

2. **Relevant suggestions**
   - Health checks to perform
   - Actions to take
   - When to see a doctor

3. **Pattern information** (if detected)
   - How often it's occurring
   - Potential pattern description
   - Recommendations for tracking

4. **Confirmation**
   - "This has been noted in your profile for tracking"
   - "This symptom is being tracked to identify if it's part of a larger recurring issue"

5. **Empathetic closing**
   - "Feel better!" (English)
   - "¡Mejórate pronto!" (Spanish)
   - "Prenez soin de vous!" (French)
   - "Gute Besserung!" (German)

## Pattern Detection Logic

### Frequency Calculation

- **Daily pattern**: Symptoms occurring daily
- **Weekly pattern**: Symptoms occurring weekly
- **Monthly pattern**: Symptoms occurring monthly

### Pattern Triggers

A pattern is detected if:
- Symptom appears **2+ times** in analysis period
- Similar symptoms are grouped (headache variations, stomach pain variations, etc.)
- Frequency exceeds thresholds (e.g., 3+ times per week)

### Pattern Types

1. **Recurring Pattern**: Same symptom appears multiple times
2. **Clustered Pattern**: Symptoms appear together in time
3. **Escalating Pattern**: Symptoms increasing in frequency/severity
4. **Trigger Pattern**: Symptoms follow specific events (e.g., after eating)

## Multilingual Support

Confirmation and closing messages are localized:

| Language | Confirmation | Closing |
|----------|-------------|---------|
| English | "This has been noted in your profile for tracking" | "Feel better!" |
| Spanish | "Esto ha sido anotado en tu perfil para seguimiento" | "¡Mejórate pronto!" |
| French | "Cela a été noté dans votre profil pour suivi" | "Prenez soin de vous!" |
| German | "Dies wurde in Ihrem Profil zur Verfolgung notiert" | "Gute Besserung!" |

## Files Created/Modified

### New Files

1. **`lib/symptom-pattern-tracking.ts`**
   - `analyzeSymptomPatterns()` - Detects recurring symptom patterns
   - `logSymptom()` - Logs symptoms for tracking
   - `getSymptomTrackingSummary()` - Gets symptom tracking summary

### Modified Files

1. **`lib/health-correlation.ts`**
   - Integrated pattern detection
   - Enhanced response format with confirmation
   - Added empathetic closings
   - Pattern information in responses

2. **`app/api/careos/capture/route.ts`**
   - Enhanced symptom storage with pattern info
   - Confirmation in saved details

3. **`app/api/sms/webhook/route.ts`**
   - Enhanced SMS responses with confirmation
   - Pattern detection integration
   - Empathetic closings

## Example Conversations

### Example 1: First-time Symptom

**User**: "I have a headache"

**Response**:
> "I see you've had surgery recently. Headaches can sometimes occur after surgery, especially if your blood pressure is elevated. Have you checked your blood pressure recently?
> 
> **This has been noted in your profile for tracking to help identify any patterns over time. Feel better!**"

### Example 2: Recurring Symptom (Pattern Detected)

**User**: "I have diarrhea again" (3rd time this week)

**Response**:
> "Given your IBS, this could be a flare-up triggered by certain foods. What did you eat recently? Consider tracking your food intake to identify patterns and avoid trigger foods.
> 
> **⚠️ Pattern detected**: You've reported this symptom 3 times in the past 7 days. This may be part of an ongoing issue that should be tracked and discussed with your healthcare provider.
> 
> **This has been noted in your profile for tracking to help identify any patterns over time. Feel better!**"

### Example 3: Food-Related Symptom

**User**: "My stomach hurts after eating"

**Response**:
> "Stomach pain after eating can indicate food intolerance or digestive issues. Given your gluten sensitivity, did you recently eat anything with gluten? Consider checking ingredient labels.
> 
> **This has been noted in your profile for tracking to help identify any patterns over time. Feel better!**"

## Benefits

1. **Continuous tracking**: Every symptom is logged for long-term pattern analysis
2. **Early pattern detection**: Identifies recurring issues before they become serious
3. **Context awareness**: Considers full health history when responding
4. **User confidence**: Confirms that symptoms are being tracked
5. **Empathetic care**: Personal touch with "Feel better!" closings
6. **Actionable insights**: Suggests specific tracking and monitoring

## Pattern Tracking Database

All symptoms are stored in `capturedItems` with:
- **Symptom details**: What the user reported
- **Correlations**: Links to health history
- **Pattern info**: If pattern detected, frequency and type
- **Suggested actions**: What to do next
- **Timestamp**: When it occurred (for pattern analysis)

## Future Enhancements

Potential improvements:
1. **Symptom diary**: Visual timeline of symptoms
2. **Trigger identification**: Automatically identify triggers (food, weather, etc.)
3. **Predictive alerts**: Warn users about likely symptom recurrence
4. **Provider reports**: Generate reports for healthcare providers
5. **Family patterns**: Track patterns across family members (if shared)

## Testing

Test the feature:

```bash
# Via Quick Capture API
POST /api/careos/capture
{
  "text": "I have a headache"
}

# Via SMS
Text "I have diarrhea" to your CareOS number
```

The system will:
1. Detect the symptom
2. Correlate with history
3. Check for patterns
4. Respond with confirmation
5. Log everything for tracking

## Privacy & Security

- **User data**: Only current user's symptoms are analyzed
- **Pattern detection**: Happens server-side, data never leaves
- **HIPAA considerations**: All symptom data stored securely
- **User control**: Users can view and manage their symptom history

