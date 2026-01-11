# Food & Dietary Health Correlation Examples

## Overview

CareOS now correlates food-related symptoms with dietary history, allergies, and digestive conditions to provide context-aware health suggestions.

## Food-Related Correlations

### 1. Food Allergies

**User says**: "I feel sick after eating"

**System detects**:
- Food allergy history (e.g., "allergic to peanuts", "shellfish allergy")

**AI Response**:
> "I see you have a history of food allergies. Could this be related to something you ate? Did you recently consume any foods you're allergic to? Consider tracking what you ate before feeling sick. If you're experiencing severe symptoms like difficulty breathing or swelling, seek immediate medical attention."

**Suggested Checks**: What you ate, symptom timing, allergic reaction signs  
**Suggested Actions**: Track food intake, Avoid known allergens, Seek medical help if severe

### 2. Gluten Sensitivity / Celiac

**User says**: "My stomach hurts"

**System detects**:
- Gluten sensitivity or celiac disease in history

**AI Response**:
> "Stomach pain can be related to several factors. I notice you have a gluten sensitivity. Did you recently eat anything with gluten? This could be a reaction. Consider checking ingredient labels and tracking what you consumed today."

**Suggested Checks**: Recent food intake, ingredient labels, symptom timing  
**Suggested Actions**: Avoid gluten, Check food labels, Monitor symptoms

### 3. Digestive Issues (IBS, GERD)

**User says**: "I have diarrhea"

**System detects**:
- IBS, GERD, or other digestive issues in history
- Dietary restrictions

**AI Response**:
> "Diarrhea can be related to dietary issues. Given your digestive condition (IBS/GERD), this could be a flare-up triggered by certain foods. What did you eat recently? Consider tracking your food intake to identify patterns and avoid trigger foods."

**Suggested Checks**: Recent meals, trigger foods, symptom patterns  
**Suggested Actions**: Track food diary, Avoid trigger foods, Stay hydrated

### 4. Food Poisoning

**User says**: "I feel nauseous and have stomach cramps"

**System detects**:
- Recent food consumption
- Food poisoning history (if any)

**AI Response**:
> "Nausea and stomach cramps after eating can indicate food intolerance or food poisoning. What did you eat recently? If you have known food allergies, check if you accidentally consumed something you're allergic to. If symptoms are severe or persist, contact your healthcare provider."

**Suggested Checks**: Recent food items, symptom timing, hydration status  
**Suggested Actions**: Stay hydrated, Rest, Seek medical care if severe

### 5. Lactose Intolerance

**User says**: "I feel bloated after eating"

**System detects**:
- Lactose intolerance or dairy sensitivity

**AI Response**:
> "Bloating can be related to food intolerances. I notice you have lactose intolerance. Did you recently consume dairy products? This could be a reaction. Consider checking if any foods contained hidden dairy ingredients."

**Suggested Checks**: Recent dairy consumption, hidden dairy ingredients  
**Suggested Actions**: Avoid dairy, Read labels, Try lactose-free alternatives

### 6. Acid Reflux / GERD

**User says**: "My chest burns after eating"

**System detects**:
- GERD or acid reflux history

**AI Response**:
> "Chest burning after eating is often related to acid reflux. Given your GERD history, this could be triggered by certain foods like spicy foods, citrus, or large meals. What did you eat? Consider avoiding trigger foods and eating smaller, more frequent meals."

**Suggested Checks**: Recent meals, trigger foods, meal timing  
**Suggested Actions**: Avoid trigger foods, Eat smaller meals, Elevate head while sleeping

## Food Keywords Detected

The system automatically detects food-related messages:

**Eating actions**: `food`, `eat`, `eating`, `meal`, `ate`, `consumed`, `drank`  
**Allergies**: `allergic`, `allergy`, `intolerant`, `intolerance`  
**Symptoms**: `vomit`, `vomiting`, `throw up`, `diarrhea`, `constipation`, `bloating`, `gas`, `cramp`, `cramps`, `indigestion`, `heartburn`, `reflux`, `upset stomach`, `stomachache`  
**Conditions**: `food poisoning`, `poisoning`, `digestive`, `digestion`, `ibs`, `celiac`, `gerd`  
**Allergens**: `gluten`, `dairy`, `lactose`, `peanut`, `shellfish`, `seafood`

## Medical History Extracted

The system automatically tracks:

- **Food allergies**: Peanuts, shellfish, dairy, etc.
- **Dietary restrictions**: Gluten-free, dairy-free, etc.
- **Digestive conditions**: IBS, GERD, celiac disease
- **Recent food items**: What the user has eaten recently
- **Food reactions**: Previous reactions to foods

## Example Conversations

### Example 1: Suspected Food Allergy Reaction

**User**: "I feel sick after eating lunch"

**System**:
- Checks history: "Allergic to shellfish"
- Checks recent items: "Had seafood pasta for lunch"
- Correlates: Shellfish allergy + seafood pasta

**Response**:
> "I notice you have a shellfish allergy and you mentioned having seafood pasta for lunch. Could this be an allergic reaction? Symptoms like nausea, stomach pain, or hives after eating shellfish could indicate an allergic response. If you're experiencing difficulty breathing, swelling, or severe symptoms, seek immediate medical attention. Consider tracking all ingredients to identify the allergen."

### Example 2: IBS Flare-Up

**User**: "I have terrible stomach cramps"

**System**:
- Checks history: "IBS diagnosis"
- Checks recent items: "Had spicy curry yesterday"

**Response**:
> "I see you have IBS, and spicy foods can often trigger flare-ups. Did you have anything spicy recently? Stomach cramps with IBS can be managed by avoiding known trigger foods. Consider keeping a food diary to identify what specifically triggers your symptoms."

### Example 3: Lactose Intolerance

**User**: "I feel bloated and gassy"

**System**:
- Checks history: "Lactose intolerant"
- Checks recent items: "Had ice cream this morning"

**Response**:
> "Bloating and gas can be signs of lactose intolerance. I notice you have lactose intolerance and you mentioned having ice cream. Dairy products like ice cream contain lactose, which could be causing your symptoms. Consider trying lactose-free alternatives or taking lactase supplements if you want to enjoy dairy occasionally."

## Integration

This feature is automatically active for:

1. **Quick Capture** (`/api/careos/capture`)
   - Text: "I feel sick after eating"
   - System automatically detects food correlation

2. **SMS/WhatsApp** (via webhook)
   - Text: "My stomach hurts after dinner"
   - System correlates with dietary history

## Benefits

1. **Allergy awareness**: Helps identify potential allergic reactions
2. **Dietary compliance**: Reminds about dietary restrictions
3. **Symptom tracking**: Connects symptoms to food intake
4. **Preventive care**: Suggests avoiding trigger foods
5. **Context-aware**: Considers full dietary history

## Safety Notes

- The system **suggests** potential connections, never diagnoses
- Always encourages seeking medical care for severe symptoms
- Provides actionable suggestions based on dietary history
- Helps users track food-symptom relationships

