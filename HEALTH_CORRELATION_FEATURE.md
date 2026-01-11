# Health Correlation Feature

## Overview

CareOS now includes **contextual health correlation** that links current symptoms with a user's medical history to provide intelligent, relevant suggestions. This feature enables the AI to:

- **Correlate symptoms** with recent medical history
- **Suggest relevant health checks** (e.g., "Have you checked your blood pressure?")
- **Identify potential connections** between current symptoms and past events
- **Provide context-aware responses** that consider the full health picture

## Example Use Cases

### Example 1: Headache After Surgery

**User messages**: "I have a headache"

**System detects**:
- Recent surgery in history (from previous captured items)
- Blood pressure concerns mentioned before

**AI Response**:
> "I see you've had surgery recently. Headaches can sometimes occur after surgery, especially if your blood pressure is elevated. Have you checked your blood pressure recently? High blood pressure post-surgery could contribute to headaches. Consider monitoring it and contacting your surgeon if the headache persists."

**Suggested Checks**: Blood pressure, temperature  
**Suggested Actions**: Monitor symptoms, Contact surgeon if persistent

### Example 2: Dizziness with Medication

**User messages**: "I feel dizzy"

**System detects**:
- Recent medication changes
- Medication interactions in history

**AI Response**:
> "Dizziness can be related to several factors. I notice you've had medication changes recently. Dizziness can sometimes be a side effect of new medications. Are you experiencing any other symptoms? Consider discussing with your doctor if this persists."

### Example 3: Chest Pain with Cardiac History

**User messages**: "My chest hurts"

**System detects**:
- Previous cardiac history
- Heart-related concerns in captured items

**AI Response**:
> "Given your cardiac history, chest pain warrants attention. I recommend monitoring your symptoms and consulting your healthcare provider promptly, especially if you experience shortness of breath, nausea, or the pain spreads to your arm or jaw. If symptoms are severe, please seek emergency care."

## How It Works

### 1. Health Context Gathering

The system retrieves the user's health context from the last 30 days:

- **Recent health items**: Symptoms, conditions, observations
- **Medications**: Current medications being tracked
- **Appointments**: Recent medical appointments
- **Medical history indicators**: Keywords like "surgery", "blood pressure", "diabetes", etc.

### 2. Symptom Analysis

When a user reports a symptom, the AI:

1. **Analyzes the current message** for health-related keywords
2. **Cross-references** with the user's health history
3. **Identifies potential connections** (even indirect ones)
4. **Suggests relevant health checks** and actions

### 3. Contextual Response Generation

The AI uses Claude API with enhanced prompts that include:

- Full health history context
- Current symptom analysis
- Correlation logic
- Safety guidelines (always suggest seeing a doctor when appropriate)

## Implementation

### Files Created

1. **`lib/health-correlation.ts`**
   - `getUserHealthContext()` - Retrieves user's health history
   - `correlateHealthSymptom()` - Correlates symptoms with history
   - `classifyWithHealthCorrelation()` - Enhanced classification with correlation

### Files Modified

1. **`app/api/careos/capture/route.ts`**
   - Now uses `classifyWithHealthCorrelation()` for health-aware classification
   - Saves correlations and suggested actions to database

2. **`app/api/sms/webhook/route.ts`**
   - Enhanced SMS classification to use health correlation
   - Automatically detects health-related messages
   - Provides context-aware responses via SMS

## API Response Format

### Enhanced Classification Response

```typescript
{
  response: string; // Contextual response with correlations
  category: 'health' | 'task' | 'appointment' | ...;
  title: string;
  details: string;
  urgency: 'low' | 'medium' | 'high';
  correlations: [
    {
      currentSymptom: string;
      relatedHistory: string;
      possibleConnection: string;
      suggestedAction: string;
      urgency: 'low' | 'medium' | 'high';
    }
  ];
  suggestedChecks: string[]; // e.g., ["blood pressure", "temperature"]
  suggestedActions: string[]; // e.g., ["Monitor symptoms", "Contact doctor"]
}
```

## Health Keywords Detected

The system automatically detects health-related messages using keywords:

- Pain: `hurt`, `pain`, `ache`, `headache`
- Symptoms: `nausea`, `dizzy`, `fever`, `tired`, `weak`
- Body parts: `chest`, `stomach`, `back`, `head`
- Medical: `blood`, `pressure`, `symptom`, `feeling`, `unwell`, `sick`, `breath`

## Medical History Indicators

The system automatically extracts medical history indicators:

- **Surgery**: "surgery", "surgical", "operation"
- **Blood Pressure**: "blood pressure", "hypertension", "bp"
- **Diabetes**: "diabetes", "diabetic"
- **Cardiac**: "heart", "cardiac", "cardiovascular"
- **Pain**: "pain", "ache", "hurt"

## Safety Guidelines

The AI follows strict safety guidelines:

1. **Not diagnostic**: The system suggests, never diagnoses
2. **Encourages medical care**: Always suggests seeing a doctor when symptoms could be serious
3. **Context-aware**: Uses history to provide relevant suggestions
4. **Non-alarming**: Provides helpful context without causing unnecessary worry
5. **Actionable**: Suggests specific checks and actions users can take

## Privacy & Security

- **User data**: Only accesses the current user's health history
- **HIPAA considerations**: All data stored securely, no PHI shared with third parties
- **Local processing**: Health correlation happens server-side, user data stays secure

## Configuration

No additional configuration required. The feature automatically:

- Detects health-related messages
- Retrieves health history
- Provides contextual correlations
- Falls back gracefully if history is unavailable

## Future Enhancements

Potential improvements:

1. **Medication interaction checks**: Detect potential medication interactions
2. **Symptom pattern recognition**: Identify recurring patterns over time
3. **Family history integration**: Include family medical history if provided
4. **Lab result correlation**: Correlate symptoms with recent lab results
5. **Proactive reminders**: Remind users to check vitals based on history

## Example Flow

```
1. User: "I have a headache"
   ↓
2. System detects health keyword: "headache"
   ↓
3. Retrieves user health context (last 30 days):
   - Recent surgery (3 days ago)
   - Blood pressure concern (5 days ago)
   ↓
4. AI correlates:
   - Headache + Recent surgery = Possible connection
   - Blood pressure concerns = Relevant factor
   ↓
5. Generates contextual response:
   "I see you've had surgery recently. Headaches can sometimes 
   occur after surgery, especially if your blood pressure is 
   elevated. Have you checked your blood pressure recently?"
   ↓
6. Suggests checks: ["blood pressure", "temperature"]
7. Suggests actions: ["Monitor symptoms", "Contact surgeon if persistent"]
```

## Testing

Test the feature:

```bash
# Via Quick Capture API
POST /api/careos/capture
{
  "text": "I have a headache"
}

# Via SMS (if configured)
Text "I have a headache" to your CareOS number
```

The system will automatically:
- Detect it's health-related
- Retrieve your health history
- Provide contextual correlation
- Suggest relevant checks and actions

