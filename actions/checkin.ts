'use server';

/**
 * Check-in Server Actions
 *
 * @module actions/checkin
 * @description Server actions for participant check-in operations
 *
 * Best Practices:
 * - Stricter rate limiting for check-in operations
 * - Full input validation with Zod
 * - Discriminated union responses
 */

import { z } from 'zod';
import { headers } from 'next/headers';
import {
  getParticipantById,
  getParticipantByEmail,
  updateCheckIn,
  resetCheckIn,
} from '@/lib/db';
import {
  CheckInTypeSchema,
  toClientParticipant,
  ClientParticipant,
  ActionResult,
  createErrorResponse,
} from '@/lib/types';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';

// ============================================================================
// Input Schemas
// ============================================================================

const CheckInInputSchema = z
  .object({
    email: z.string().email().optional(),
    participantId: z.string().min(1).optional(),
    checkInType: CheckInTypeSchema,
  })
  .refine((data) => data.email !== undefined || data.participantId !== undefined, {
    message: 'Either email or participantId is required',
  });

const ResetCheckInInputSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
  checkInType: CheckInTypeSchema,
});

// ============================================================================
// Types
// ============================================================================

type CheckInInput = z.infer<typeof CheckInInputSchema>;
type ResetCheckInInput = z.infer<typeof ResetCheckInInputSchema>;

interface CheckInSuccessData {
  participant: ClientParticipant;
  checkInTime: string;
}

// ============================================================================
// Rate Limiting Helper
// ============================================================================

async function getRateLimitIdentifier(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'anonymous';
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Perform participant check-in
 */
export async function checkInAction(
  input: CheckInInput
): Promise<ActionResult<CheckInSuccessData>> {
  // Rate limiting (stricter for check-in)
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.API);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  // Validate input
  const parseResult = CheckInInputSchema.safeParse(input);

  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error.issues[0]?.message ?? 'Invalid input',
      'VALIDATION_ERROR'
    );
  }

  const { email, participantId, checkInType } = parseResult.data;

  try {
    // Get participant by email or ID
    const participant = participantId
      ? await getParticipantById(participantId)
      : email
        ? await getParticipantByEmail(email)
        : null;

    if (!participant) {
      return createErrorResponse('Participant not found', 'NOT_FOUND');
    }

    // Check if already checked in
    const currentCheckIn = participant[checkInType];
    if (currentCheckIn?.status) {
      return {
        success: true,
        data: {
          participant: toClientParticipant(participant),
          checkInTime: currentCheckIn.time?.toISOString() ?? new Date().toISOString(),
        },
        message: 'Already checked in',
      };
    }

    // Perform check-in
    const updated = await updateCheckIn(participant.participantId, checkInType);

    if (!updated) {
      return createErrorResponse('Failed to update check-in status', 'DB_ERROR');
    }

    const checkInTime = new Date().toISOString();

    const updatedParticipant = {
      ...participant,
      [checkInType]: {
        status: true,
        time: new Date(),
      },
    };

    return {
      success: true,
      data: {
        participant: toClientParticipant(updatedParticipant),
        checkInTime,
      },
      message: 'Check-in successful',
    };
  } catch (error) {
    console.error('Check-in error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to perform check-in',
      'DB_ERROR'
    );
  }
}

/**
 * Reset check-in status for a participant
 */
export async function resetCheckInAction(
  input: ResetCheckInInput
): Promise<ActionResult<ClientParticipant>> {
  // Rate limiting
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.API);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  // Validate input
  const parseResult = ResetCheckInInputSchema.safeParse(input);

  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error.issues[0]?.message ?? 'Invalid input',
      'VALIDATION_ERROR'
    );
  }

  const { participantId, checkInType } = parseResult.data;

  try {
    const participant = await getParticipantById(participantId);

    if (!participant) {
      return createErrorResponse('Participant not found', 'NOT_FOUND');
    }

    const updated = await resetCheckIn(participantId, checkInType);

    if (!updated) {
      return createErrorResponse('Failed to reset check-in status', 'DB_ERROR');
    }

    const updatedParticipant = {
      ...participant,
      [checkInType]: {
        status: false,
        time: undefined,
      },
    };

    return {
      success: true,
      data: toClientParticipant(updatedParticipant),
      message: 'Check-in reset successful',
    };
  } catch (error) {
    console.error('Reset check-in error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to reset check-in',
      'DB_ERROR'
    );
  }
}

/**
 * Quick college check-in by participant ID
 */
export async function collegeCheckInAction(
  participantId: string
): Promise<ActionResult<CheckInSuccessData>> {
  return checkInAction({
    participantId,
    checkInType: 'collegeCheckIn',
  });
}

/**
 * Quick lab check-in by participant ID
 */
export async function labCheckInAction(
  participantId: string
): Promise<ActionResult<CheckInSuccessData>> {
  return checkInAction({
    participantId,
    checkInType: 'labCheckIn',
  });
}

/**
 * Manual check-in verifying both Participant ID and Team ID
 */
export async function manualCheckInAction(
  participantId: string,
  teamId: string
): Promise<ActionResult<CheckInSuccessData>> {
  // Rate limiting
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.API);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const participant = await getParticipantById(participantId);

    if (!participant) {
      return createErrorResponse('Participant not found', 'NOT_FOUND');
    }

    // Verify Team ID
    if (participant.teamId !== teamId) {
      return createErrorResponse('Invalid Team ID provided for this participant', 'VALIDATION_ERROR');
    }

    // Pass to standard check-in logic
    return checkInAction({
      participantId,
      checkInType: 'collegeCheckIn',
    });
  } catch (error) {
    console.error('Manual check-in error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to perform manual check-in',
      'DB_ERROR'
    );
  }
}
