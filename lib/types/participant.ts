/**
 * Participant Domain Types & Zod Schemas
 *
 * @module lib/types/participant
 * @description Strict type definitions with runtime validation for participants
 * Aligned with Admin Dashboard DBParticipant interface.
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas (Runtime Validation)
// ============================================================================

export const WifiCredentialsSchema = z.object({
  ssid: z.string().optional(),
  password: z.string().optional(),
});

export const CheckInStatusSchema = z.object({
  status: z.boolean(),
  time: z.date().optional(),
});

/**
 * Meal status — simple boolean flags, aligned with admin dashboard.
 * Day 1 → Dinner
 * Day 2 → Breakfast, Lunch, Dinner
 * Day 3 → Breakfast, Lunch
 */
export const MealStatusSchema = z.object({
  day1_dinner:    z.boolean().default(false),
  day2_breakfast: z.boolean().default(false),
  day2_lunch:     z.boolean().default(false),
  day2_dinner:    z.boolean().default(false),
  day3_breakfast: z.boolean().default(false),
  day3_lunch:     z.boolean().default(false),
});

/**
 * Database participant schema — aligned with Admin Dashboard DBParticipant
 */
export const DBParticipantSchema = z.object({
  _id: z.string().optional(),

  participantId: z.string().min(1, 'Participant ID is required'),

  // Basic Info
  name:  z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role:  z.string().optional(),

  // Team
  teamName: z.string().optional(),
  teamId:   z.string().optional(),

  // Project
  projectName:        z.string().optional(),
  projectDescription: z.string().optional(),

  // Venue
  institute:    z.string().optional(),
  state:        z.string().optional(),
  labAllotted:  z.string().optional(),
  roomNo:       z.string().optional(), // checkin-only field, kept

  wifiCredentials: WifiCredentialsSchema.optional(),

  // Auth — checkin-only field, kept
  loginPassword: z.string().optional(),

  // Check-in / Check-out
  collegeCheckIn:  CheckInStatusSchema.optional(),
  labCheckIn:      CheckInStatusSchema.optional(),
  collegeCheckOut: CheckInStatusSchema.optional(),
  labCheckOut:     CheckInStatusSchema.optional(),
  tempLabCheckOut: CheckInStatusSchema.optional(),

  // Meals — field name and structure aligned with admin dashboard
  meals: MealStatusSchema.optional(),

  // Metadata
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Client-safe participant schema (no ObjectId, dates as ISO strings)
 */
export const ClientParticipantSchema = z.object({
  participantId: z.string(),
  name:          z.string(),
  email:         z.string(),
  phone:         z.string().optional(),
  role:          z.string().optional(),
  teamName:      z.string().optional(),
  teamId:        z.string().optional(),
  projectName:        z.string().optional(),
  projectDescription: z.string().optional(),
  institute:    z.string().optional(),
  state:        z.string().optional(),
  labAllotted:  z.string().optional(),
  roomNo:       z.string().optional(),

  wifiCredentials: WifiCredentialsSchema.optional(),

  collegeCheckIn:  z.object({ status: z.boolean(), time: z.string().optional() }).optional(),
  labCheckIn:      z.object({ status: z.boolean(), time: z.string().optional() }).optional(),
  collegeCheckOut: z.object({ status: z.boolean(), time: z.string().optional() }).optional(),
  labCheckOut:     z.object({ status: z.boolean(), time: z.string().optional() }).optional(),
  tempLabCheckOut: z.object({ status: z.boolean(), time: z.string().optional() }).optional(),

  meals: MealStatusSchema.optional(),
});

export const CheckInTypeSchema = z.enum(['collegeCheckIn', 'labCheckIn']);

export const CheckInInputSchema = z
  .object({
    email:         z.string().email().optional(),
    participantId: z.string().min(1).optional(),
    checkInType:   CheckInTypeSchema,
  })
  .refine(
    (data) => data.email !== undefined || data.participantId !== undefined,
    { message: 'Either email or participantId is required' }
  );

// ============================================================================
// TypeScript Types
// ============================================================================

export type WifiCredentials  = z.infer<typeof WifiCredentialsSchema>;
export type CheckInStatus    = z.infer<typeof CheckInStatusSchema>;
export type DBParticipant    = z.infer<typeof DBParticipantSchema>;
export type ClientParticipant = z.infer<typeof ClientParticipantSchema>;
export type CheckInType      = z.infer<typeof CheckInTypeSchema>;
export type CheckInInput     = z.infer<typeof CheckInInputSchema>;
export type MealStatus       = z.infer<typeof MealStatusSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

function mapCheckIn(field?: { status: boolean; time?: Date }) {
  if (!field) return undefined;
  return {
    status: field.status,
    time:   field.time?.toISOString(),
  };
}

export function toClientParticipant(participant: DBParticipant): ClientParticipant {
  return {
    participantId:      participant.participantId,
    name:               participant.name,
    email:              participant.email,
    phone:              participant.phone,
    role:               participant.role,
    teamName:           participant.teamName,
    teamId:             participant.teamId,
    projectName:        participant.projectName,
    projectDescription: participant.projectDescription,
    institute:          participant.institute,
    state:              participant.state,
    labAllotted:        participant.labAllotted,
    roomNo:             participant.roomNo,
    wifiCredentials:    participant.wifiCredentials,
    collegeCheckIn:     mapCheckIn(participant.collegeCheckIn),
    labCheckIn:         mapCheckIn(participant.labCheckIn),
    collegeCheckOut:    mapCheckIn(participant.collegeCheckOut),
    labCheckOut:        mapCheckIn(participant.labCheckOut),
    tempLabCheckOut:    mapCheckIn(participant.tempLabCheckOut),
    meals:              participant.meals,
  };
}