import { z } from 'zod';

/**
 * Zod schemas for partner lead ingestion validation
 */

export const InboundLeadSchema = z.object({
  source_platform: z.string().min(1).max(50),
  source_conversation_id: z.string().min(1).max(255),
  user_phone_hash: z.string().length(64), // SHA-256 hash is 64 hex characters
  user_phone_encrypted: z.string().min(1), // Base64 encoded
  user_name: z.string().max(255).optional(),
  user_language: z.string().length(2), // ISO 639-1 language code
  user_location_state: z.string().max(100).optional(),
  user_location_country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
  user_location_city: z.string().max(100).optional(),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  original_message: z.string().min(1).max(5000),
  ai_extracted_details: z.object({
    urgency: z.enum(['low', 'medium', 'high']).optional(),
    person_mentioned: z.string().max(100).optional(),
    service_type: z.string().max(100).optional(),
    condition_mentioned: z.string().max(200).optional(),
  }).optional(),
  user_consent: z.boolean(),
  consent_timestamp: z.string().datetime(), // ISO 8601
  lead_value_agreed: z.number().min(0).max(10000), // Max $10,000 per lead
});

export type InboundLead = z.infer<typeof InboundLeadSchema>;

