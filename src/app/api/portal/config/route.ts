// src/app/api/portal/config/route.ts
// Read-only endpoint for the participant portal.
// Reads from the same `participant_portal` collection that the admin dashboard writes to.

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME    = 'hackoverflow';
const COLLECTION = 'participant_portal';

function serialize(doc: any): any {
  return JSON.parse(
    JSON.stringify(doc, (_key, val) => {
      if (val && typeof val === 'object' && val.constructor?.name === 'ObjectId') {
        return val.toString();
      }
      if (val instanceof Date) return val.toISOString();
      return val;
    })
  );
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db     = client.db(DB_NAME);

    let doc = await db.collection(COLLECTION).findOne({});

    // Return safe defaults if admin hasn't configured anything yet
    if (!doc) {
      return NextResponse.json({
        config: { alerts: [], schedule: [], mealSchedule: [] },
      });
    }

    return NextResponse.json({ config: serialize(doc) });
  } catch (err) {
    console.error('[GET /api/portal/config]', err);
    return NextResponse.json(
      { config: { alerts: [], schedule: [], mealSchedule: [] } },
      { status: 500 }
    );
  }
}