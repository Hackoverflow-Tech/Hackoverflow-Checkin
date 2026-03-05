/**
 * Auth Validation Schemas
 *
 * @module lib/validation
 * @description JWT payload schema used by lib/auth.ts.
 * All participant schemas live in lib/types/participant.ts
 */

import { z } from 'zod';

export const JWTPayloadSchema = z.object({
  userId: z.string().min(1),
  email:  z.string().email(),
  name:   z.string().optional(),
  role:   z.enum(['admin', 'user', 'moderator', 'participant']).default('participant'),
  iat:    z.number().optional(),
  exp:    z.number().optional(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;