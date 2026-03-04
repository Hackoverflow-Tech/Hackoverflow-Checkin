/**
 * Participant Domain Types & Zod Schemas
 *
 * @module lib/types/participant
 * @description Strict type definitions with runtime validation for participants
 */

import { z } from 'zod';
import { ObjectId } from 'mongodb';

// ============================================================================
// Zod Schemas (Runtime Validation)
// ============================================================================

/**
 * WiFi credentials schema
 */
export const WifiCredentialsSchema = z.object({
  ssid: z.string().optional(),
  password: z.string().optional(),
});

/**
 * Check-in status schema
 */
export const CheckInStatusSchema = z.object({
  status: z.boolean(),
  time: z.date().nullable().optional(),
});

/**
 * NEW: Meal Slot Schemas for Database (uses Date)
 */
export const MealSlotSchema = z.object({
  status: z.boolean().default(false),
  time: z.date().nullable().optional(),
});

export const MealStatusSchema = z.object({
  day1_dinner: MealSlotSchema.optional(),
  day2_breakfast: MealSlotSchema.optional(),
  day2_lunch: MealSlotSchema.optional(),
  day2_dinner: MealSlotSchema.optional(),
  day3_breakfast: MealSlotSchema.optional(),
  day3_lunch: MealSlotSchema.optional(),
});

/**
 * Database participant schema - represents a participant document in MongoDB
 */
export const DBParticipantSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  participantId: z.string().min(1, 'Participant ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.string().optional(),
  teamName: z.string().optional(),
  teamId: z.string().optional(),
  institute: z.string().optional(),
  labAllotted: z.string().optional(),
  roomNo: z.string().optional(), // Accommodation room number
  loginPassword: z.string().optional(), // plain-text password from registration stored in DB
  wifiCredentials: WifiCredentialsSchema.optional(),
  collegeCheckIn: CheckInStatusSchema.optional(),
  labCheckIn: CheckInStatusSchema.optional(),
  collegeCheckOut: CheckInStatusSchema.optional(),
  labCheckOut: CheckInStatusSchema.optional(),
  tempLabCheckOut: CheckInStatusSchema.optional(),
  mealStatus: MealStatusSchema.optional(), // <--- ADDED THIS LINE
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * NEW: Client-safe Meal Slot Schemas (converts Date to string)
 */
export const ClientMealSlotSchema = z.object({
  status: z.boolean().default(false),
  time: z.string().nullable().optional(),
});

export const ClientMealStatusSchema = z.object({
  day1_dinner: ClientMealSlotSchema.optional(),
  day2_breakfast: ClientMealSlotSchema.optional(),
  day2_lunch: ClientMealSlotSchema.optional(),
  day2_dinner: ClientMealSlotSchema.optional(),
  day3_breakfast: ClientMealSlotSchema.optional(),
  day3_lunch: ClientMealSlotSchema.optional(),
});

/**
 * Client-safe participant schema (excludes MongoDB ObjectId)
 */
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
  collegeCheckIn: z
    .object({
      status: z.boolean(),
      time: z.string().optional(),
    })
    .optional(),
  labCheckIn: z
    .object({
      status: z.boolean(),
      time: z.string().optional(),
    })
    .optional(),
  collegeCheckOut: z
    .object({
      status: z.boolean(),
      time: z.string().optional(),
    })
    .optional(),
  labCheckOut: z
    .object({
      status: z.boolean(),
      time: z.string().optional(),
    })
    .optional(),
  tempLabCheckOut: z
    .object({
      status: z.boolean(),
      time: z.string().optional(),
    })
    .optional(),
  mealStatus: ClientMealStatusSchema.optional(), // <--- ADDED THIS LINE
});

/**
 * Check-in type enum schema
 */
export const CheckInTypeSchema = z.enum([
  'collegeCheckIn',
  'labCheckIn',
  'collegeCheckOut',
  'labCheckOut',
  'tempLabCheckOut'
]);

/**
 * Check-in request input schema
 */
export const CheckInInputSchema = z.object({
  email: z.string().email().optional(),
  participantId: z.string().min(1).optional(),
  checkInType: CheckInTypeSchema,
}).refine(
  (data) => data.email !== undefined || data.participantId !== undefined,
  {
    message: 'Either email or participantId is required',
  }
);

// ============================================================================
// TypeScript Types (Static Typing)
// ============================================================================

export type WifiCredentials = z.infer<typeof WifiCredentialsSchema>;
export type CheckInStatus = z.infer<typeof CheckInStatusSchema>;
export type DBParticipant = z.infer<typeof DBParticipantSchema>;
export type ClientParticipant = z.infer<typeof ClientParticipantSchema>;
export type CheckInType = z.infer<typeof CheckInTypeSchema>;
export type CheckInInput = z.infer<typeof CheckInInputSchema>;
export type MealStatus = z.infer<typeof MealStatusSchema>; // <--- ADDED THIS LINE

// ============================================================================
// Utility Functions
// ============================================================================

// NEW HELPER: Safely converts a DB Meal Slot (Date) to a Client Meal Slot (String)
function mapMealSlot(slot?: z.infer<typeof MealSlotSchema>) {
  if (!slot) return undefined;
  return {
    status: slot.status,
    time: slot.time ? slot.time.toISOString() : undefined,
  };
}

/**
 * Transforms a database participant to a client-safe participant
 * Removes MongoDB ObjectId and converts dates to ISO strings
 */
export function toClientParticipant(participant: DBParticipant): ClientParticipant {
  return {
    participantId: participant.participantId,
    name: participant.name,
    email: participant.email,
    phone: participant.phone,
    role: participant.role,
    teamName: participant.teamName,
    teamId: participant.teamId,
    institute: participant.institute,
    labAllotted: participant.labAllotted,
    roomNo: participant.roomNo,
    wifiCredentials: participant.wifiCredentials,
    collegeCheckIn: participant.collegeCheckIn
      ? {
        status: participant.collegeCheckIn.status,
        time: participant.collegeCheckIn.time?.toISOString(),
      }
      : undefined,
    labCheckIn: participant.labCheckIn
      ? {
        status: participant.labCheckIn.status,
        time: participant.labCheckIn.time?.toISOString(),
      }
      : undefined,
    collegeCheckOut: participant.collegeCheckOut
      ? {
        status: participant.collegeCheckOut.status,
        time: participant.collegeCheckOut.time?.toISOString(),
      }
      : undefined,
    labCheckOut: participant.labCheckOut
      ? {
        status: participant.labCheckOut.status,
        time: participant.labCheckOut.time?.toISOString(),
      }
      : undefined,
    tempLabCheckOut: participant.tempLabCheckOut
      ? {
        status: participant.tempLabCheckOut.status,
        time: participant.tempLabCheckOut.time?.toISOString(),
      }
      : undefined,

    mealStatus: participant.mealStatus
      ? {
        day1_dinner: mapMealSlot(participant.mealStatus.day1_dinner),
        day2_breakfast: mapMealSlot(participant.mealStatus.day2_breakfast),
        day2_lunch: mapMealSlot(participant.mealStatus.day2_lunch),
        day2_dinner: mapMealSlot(participant.mealStatus.day2_dinner),
        day3_breakfast: mapMealSlot(participant.mealStatus.day3_breakfast),
        day3_lunch: mapMealSlot(participant.mealStatus.day3_lunch),
      }
      : undefined,
  };
}