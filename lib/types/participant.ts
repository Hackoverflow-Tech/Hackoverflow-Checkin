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
  time: z.date().optional(),
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
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
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
});

/**
 * Check-in type enum schema
 */
export const CheckInTypeSchema = z.enum(['collegeCheckIn', 'labCheckIn']);

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

// ============================================================================
// Utility Functions
// ============================================================================

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
  };
}
