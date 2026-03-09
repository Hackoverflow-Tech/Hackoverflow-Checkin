'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DB = 'hackoverflow';

async function getDb() {
  const client = await clientPromise;
  return client.db(DB);
}

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedAlert {
  _id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
}

export interface AlertsData {
  broadcasts: FeedAlert[];
  activity: FeedAlert[];
}

// ─── getAlertsData ────────────────────────────────────────────────────────────
//
// Replaces GET /api/alerts
// Returns:
//   broadcasts — active alerts from participant_portal.alerts[]
//   activity   — this participant's checkin_logs (college, lab, meal)

export async function getAlertsData(): Promise<AlertsData> {
  try {
    const db            = await getDb();
    const participantId = await getParticipantId();

    // ── Broadcasts ────────────────────────────────────────────────────────────
    const portalDoc  = await db.collection('participant_portal').findOne({});
    const rawAlerts  = (portalDoc?.alerts ?? []) as any[];

    const broadcasts: FeedAlert[] = rawAlerts
      .filter((a: any) => a.isActive)
      .map((a: any) => ({
        _id:       a.alertId ?? a._id?.toString() ?? '',
        title:     a.title   ?? '',
        body:      a.message ?? '',
        type:      severityToType(a.severity ?? 'info'),
        createdAt: a.createdAt
          ? new Date(a.createdAt).toISOString()
          : new Date().toISOString(),
      }))
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    // ── Activity ──────────────────────────────────────────────────────────────
    let activity: FeedAlert[] = [];

    if (participantId) {
      const logs = await db
        .collection('checkin_logs')
        .find({ participantId })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();

      activity = logs.map((log: any) => ({
        _id:       log.logId ?? log._id?.toString() ?? '',
        title:     actionTitle(log.actionType),
        body:      actionBody(log),
        type:      actionToType(log.actionType),
        createdAt: log.timestamp
          ? new Date(log.timestamp).toISOString()
          : new Date().toISOString(),
      }));
    }

    return { broadcasts: clean(broadcasts), activity: clean(activity) };
  } catch (err) {
    console.error('getAlertsData error:', err);
    return { broadcasts: [], activity: [] };
  }
}

// ─── savePushSubscription ─────────────────────────────────────────────────────
//
// Replaces POST /api/alerts/subscribe
// Upserts by endpoint — re-subscribing never creates duplicates.

export async function savePushSubscription(
  subscription: PushSubscriptionJSON
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!subscription?.endpoint) {
      return { success: false, error: 'Invalid subscription object.' };
    }

    const db            = await getDb();
    const participantId = await getParticipantId();

    await db.collection('push_subscriptions').updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint:      subscription.endpoint,
          keys:          subscription.keys ?? {},
          participantId: participantId ?? null,
          updatedAt:     new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return { success: true };
  } catch (err) {
    console.error('savePushSubscription error:', err);
    return { success: false, error: 'Failed to save subscription.' };
  }
}

// ─── Label helpers ─────────────────────────────────────────────────────────────

function severityToType(severity: string): string {
  const map: Record<string, string> = {
    info:    'reminder',
    warning: 'broadcast',
    urgent:  'urgent',
    success: 'activity',
  };
  return map[severity] ?? 'broadcast';
}

function actionToType(actionType: string): string {
  if (actionType?.includes('meal')) return 'meal';
  return 'activity';
}

function actionTitle(actionType: string): string {
  const map: Record<string, string> = {
    college_checkin:  'College Check-In',
    college_checkout: 'College Check-Out',
    lab_checkin:      'Lab Check-In',
    lab_checkout:     'Lab Check-Out',
    meal_claim:       'Meal Claimed',
  };
  return map[actionType] ?? 'Activity';
}

function actionBody(log: any): string {
  switch (log.actionType) {
    case 'college_checkin':  return 'You were checked into the college venue.';
    case 'college_checkout': return 'You were checked out of the college venue.';
    case 'lab_checkin':      return 'You checked into your assigned lab.';
    case 'lab_checkout':     return 'You checked out of the lab.';
    case 'meal_claim':       return `You claimed: ${log.mealKey?.replace(/_/g, ' ') ?? 'a meal'}.`;
    default:                 return 'Status updated.';
  }
}