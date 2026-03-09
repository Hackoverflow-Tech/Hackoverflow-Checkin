'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { DBParticipant, MealStatus, ParticipantPortalConfig } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DB = 'hackoverflow';

async function getDb() {
  const client = await clientPromise;
  return client.db(DB);
}

/** Same clean() serializer used across all actions */
function clean(doc: any): any {
  return JSON.parse(
    JSON.stringify(doc, (_, v) => {
      if (v?.constructor?.name === 'ObjectId') return v.toString();
      if (v instanceof Date) return v.toISOString();
      return v;
    })
  );
}

async function getParticipantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('participant_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token) as any;
  if (!payload) return null;
  return payload.participantId ?? payload.id ?? payload.sub ?? null;
}

// ─── Result types ─────────────────────────────────────────────────────────────

interface MealActionResult {
  success: boolean;
  data?: DBParticipant;
  error?: string;
}

// ─── getSelfWithMeals ─────────────────────────────────────────────────────────

/**
 * Returns the logged-in participant's full data (including meals).
 * Called on food page mount.
 */
export async function getSelfWithMeals(): Promise<DBParticipant | null> {
  try {
    const participantId = await getParticipantId();
    if (!participantId) return null;

    const db = await getDb();
    const doc = await db.collection('participants').findOne({ participantId });
    if (!doc) return null;

    const { loginPassword: _, ...rest } = doc as any;
    return clean(rest) as DBParticipant;
  } catch (err) {
    console.error('getSelfWithMeals error:', err);
    return null;
  }
}

// ─── getMealPortalConfig ──────────────────────────────────────────────────────

/**
 * Returns the participant portal config (meal schedule windows, alerts etc).
 * Used to know which meal windows are currently open / enabled by admin.
 * Reads from the `participant_portal` collection — single document.
 */
export async function getMealPortalConfig(): Promise<ParticipantPortalConfig | null> {
  try {
    const db = await getDb();
    const doc = await db.collection('participant_portal').findOne({});
    if (!doc) return null;
    return clean(doc) as ParticipantPortalConfig;
  } catch (err) {
    console.error('getMealPortalConfig error:', err);
    return null;
  }
}

// ─── claimMealAction ──────────────────────────────────────────────────────────

/**
 * Marks a meal as claimed for the current participant.
 *
 * Guards:
 *  - Must be authenticated
 *  - Must be checked into college
 *  - Meal must not already be claimed
 *  - The meal window must be currently enabled AND open (admin-controlled)
 */
export async function claimMealAction(
  mealKey: keyof MealStatus
): Promise<MealActionResult> {
  try {
    const participantId = await getParticipantId();
    if (!participantId) {
      return { success: false, error: 'Not authenticated. Please log in.' };
    }

    const db = await getDb();

    // ── Fetch participant ─────────────────────────────────────────────────────
    const doc = await db.collection('participants').findOne({ participantId });
    if (!doc) return { success: false, error: 'Participant not found.' };

    if (!doc.collegeCheckIn?.status) {
      return { success: false, error: 'You must be checked into college to claim meals.' };
    }

    // ── Already claimed? ──────────────────────────────────────────────────────
    if (doc.meals?.[mealKey]) {
      // Return current data so UI can sync
      const { loginPassword: _, ...rest } = doc as any;
      return { success: true, data: clean(rest) as DBParticipant };
    }

    // ── Check meal window is open ─────────────────────────────────────────────
    const portalDoc = await db.collection('participant_portal').findOne({});
    if (!portalDoc) {
      return { success: false, error: 'Portal config not found. Contact an admin.' };
    }

    const windowConfig = (portalDoc.mealSchedule ?? []).find(
      (w: any) => w.mealKey === mealKey
    );

    if (!windowConfig) {
      return { success: false, error: 'Meal window not configured yet. Contact an admin.' };
    }

    if (!windowConfig.isEnabled) {
      return { success: false, error: 'This meal window is not open yet. Check back later.' };
    }

    const now = new Date();
    const opensAt  = new Date(windowConfig.opensAt);
    const closesAt = new Date(windowConfig.closesAt);

    if (now < opensAt) {
      return {
        success: false,
        error: `Meal window hasn't opened yet. Opens at ${opensAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      };
    }

    if (now > closesAt) {
      return {
        success: false,
        error: `Meal window has closed. It closed at ${closesAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      };
    }

    // ── Claim the meal ────────────────────────────────────────────────────────
    await db.collection('participants').updateOne(
      { participantId },
      {
        $set: {
          [`meals.${mealKey}`]: true,
          updatedAt: now,
        },
      }
    );

    // Log it
    try {
      await db.collection('checkin_logs').insertOne({
        logId: new (await import('mongodb')).ObjectId().toString(),
        participantId,
        participantName: doc.name,
        actionType: 'meal_claim',
        mealKey,
        timestamp: now,
      });
    } catch { /* non-fatal */ }

    const updated = await db.collection('participants').findOne({ participantId });
    const { loginPassword: _, ...rest } = updated as any;
    return { success: true, data: clean(rest) as DBParticipant };
  } catch (err) {
    console.error('claimMealAction error:', err);
    return { success: false, error: 'Failed to claim meal. Please try again.' };
  }
}