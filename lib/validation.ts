/**
 * Validation Schemas and Utilities
 *
 * Centralized validation using Zod for type-safe request validation.
 * Harmonized between Dashboard and Checkin repositories.
 *
 * @module lib/validation
 */

import { z } from 'zod';

// ============================================================================
// Auth & JWT Schemas (Shared with Dashboard)
// ============================================================================

export const JWTPayloadSchema = z.object({
    userId: z.string().min(1),
    email: z.string().email(),
    name: z.string().optional(),
    role: z.enum(['admin', 'user', 'moderator', 'participant']).default('participant'),
    iat: z.number().optional(),
    exp: z.number().optional(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// ============================================================================
// Participant Schemas
// ============================================================================

export const WifiCredentialsSchema = z.object({
    ssid: z.string().optional(),
    password: z.string().optional(),
});

export const CheckInStatusSchema = z.object({
    status: z.boolean(),
    time: z.date().optional(),
});

export const DBParticipantSchema = z.object({
    _id: z.any().optional(),
    participantId: z.string().min(1, 'Participant ID is required'),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    role: z.string().optional(),
    teamName: z.string().optional(),
    teamId: z.string().optional(),
    institute: z.string().optional(),
    labAllotted: z.string().optional(),
    roomNo: z.string().optional(),
    loginPassword: z.string().optional(),
    wifiCredentials: WifiCredentialsSchema.optional(),
    collegeCheckIn: CheckInStatusSchema.optional(),
    labCheckIn: CheckInStatusSchema.optional(),
    collegeCheckOut: CheckInStatusSchema.optional(),
    tempLabCheckOut: CheckInStatusSchema.optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const ClientParticipantSchema = z.object({
    participantId: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    role: z.string().optional(),
    teamName: z.string().optional(),
    teamId: z.string().optional(),
    institute: z.string().optional(),
    labAllotted: z.string().optional(),
    roomNo: z.string().optional(),
    wifiCredentials: WifiCredentialsSchema.optional(),
    collegeCheckIn: z.object({ status: z.boolean(), time: z.string().optional() }).optional(),
    labCheckIn: z.object({ status: z.boolean(), time: z.string().optional() }).optional(),
});

export const CheckInTypeSchema = z.enum(['collegeCheckIn', 'labCheckIn']);

export const CheckInInputSchema = z.object({
    email: z.string().email().optional(),
    participantId: z.string().optional(),
    checkInType: CheckInTypeSchema,
}).refine(data => data.email !== undefined || data.participantId !== undefined, {
    message: 'Either email or participantId must be provided',
    path: ['email'],
});

export const LoginRequestSchema = z.object({
    email: z.string().email('Please provide a valid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required').max(128),
});

export type WifiCredentials = z.infer<typeof WifiCredentialsSchema>;
export type CheckInStatus = z.infer<typeof CheckInStatusSchema>;
export type DBParticipant = z.infer<typeof DBParticipantSchema>;
export type ClientParticipant = z.infer<typeof ClientParticipantSchema>;
export type CheckInType = z.infer<typeof CheckInTypeSchema>;
export type CheckInInput = z.infer<typeof CheckInInputSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// ============================================================================
// Utilities
// ============================================================================

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; errors: z.ZodError };

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    const result = schema.safeParse(data);
    return result.success
        ? { success: true, data: result.data }
        : { success: false, errors: result.error };
}

export function formatValidationErrors(error: z.ZodError): {
    message: string;
    details: Array<{ field: string; message: string }>;
} {
    const details = (error.issues ?? []).map(issue => ({
        field: issue.path.join('.') || 'unknown',
        message: issue.message,
    }));
    return { message: details[0]?.message ?? 'Validation failed', details };
}
