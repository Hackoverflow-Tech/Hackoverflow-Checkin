'use server';

/**
 * Participant Server Actions
 *
 * @module actions/participants
 * @description Server actions for participant data retrieval and meal updates
 */

import {
  getParticipantById,
  getParticipantByEmail,
  getAllParticipants,
  getParticipantsPaginated,
  countParticipants,
  updateMealStatus,
  getParticipantsByTeamId,
} from '@/lib/db';
import {
  toClientParticipant,
  ClientParticipant,
  ActionResult,
  createErrorResponse,
} from '@/lib/types';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';
import { headers } from 'next/headers';

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

export async function getParticipantByIdAction(
  participantId: string
): Promise<ActionResult<ClientParticipant>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const participant = await getParticipantById(participantId);
    if (!participant) return createErrorResponse('Participant not found', 'NOT_FOUND');
    return { success: true, data: toClientParticipant(participant) };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch participant',
      'DB_ERROR'
    );
  }
}

export async function getParticipantByEmailAction(
  email: string
): Promise<ActionResult<ClientParticipant>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const participant = await getParticipantByEmail(email);
    if (!participant) return createErrorResponse('Participant not found', 'NOT_FOUND');
    return { success: true, data: toClientParticipant(participant) };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch participant',
      'DB_ERROR'
    );
  }
}

export async function getParticipantsAction(): Promise<ActionResult<ClientParticipant[]>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const participants = await getAllParticipants();
    return { success: true, data: participants.map(toClientParticipant) };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch participants',
      'DB_ERROR'
    );
  }
}

export async function getParticipantsPaginatedAction(
  page: number,
  pageSize: number
): Promise<ActionResult<{ participants: ClientParticipant[]; total: number; pages: number }>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const result = await getParticipantsPaginated(page, pageSize);
    return { success: true, data: result };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch participants',
      'DB_ERROR'
    );
  }
}

export async function getParticipantCountAction(): Promise<ActionResult<number>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const count = await countParticipants();
    return { success: true, data: count };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to count participants',
      'DB_ERROR'
    );
  }
}

/**
 * Mark a meal as consumed for a participant.
 * Writes a simple boolean true to meals.${mealKey} in MongoDB,
 * aligned with the admin dashboard MealStatus structure.
 */
export async function markMealConsumedAction(
  participantId: string,
  mealKey: string
): Promise<ActionResult<{ participantId: string; mealKey: string }>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.API);
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  const validMealKeys = [
    'day1_dinner',
    'day2_breakfast',
    'day2_lunch',
    'day2_dinner',
    'day3_breakfast',
    'day3_lunch',
  ];

  if (!validMealKeys.includes(mealKey)) {
    return createErrorResponse('Invalid meal key', 'VALIDATION_ERROR');
  }

  try {
    const participant = await getParticipantById(participantId);
    if (!participant) return createErrorResponse('Participant not found', 'NOT_FOUND');

    const alreadyConsumed = participant.meals?.[mealKey as keyof typeof participant.meals];
    if (alreadyConsumed) {
      return createErrorResponse('Meal already redeemed', 'VALIDATION_ERROR');
    }

    const updated = await updateMealStatus(participantId, mealKey);
    if (!updated) return createErrorResponse('Failed to update meal status', 'DB_ERROR');

    return { success: true, data: { participantId, mealKey } };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to mark meal as consumed',
      'DB_ERROR'
    );
  }
}

/**
 * Get all members of a team by teamId.
 */
export async function getTeamMembersAction(
  teamId: string
): Promise<ActionResult<ClientParticipant[]>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const members = await getParticipantsByTeamId(teamId);
    return { success: true, data: members.map(toClientParticipant) };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch team members',
      'DB_ERROR'
    );
  }
}