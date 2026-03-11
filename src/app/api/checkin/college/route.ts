import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'hackoverflow';
const COLLECTION = 'participants';

export async function POST(req: NextRequest) {
  try {
    const { participantId } = await req.json();
    if (!participantId) {
      return NextResponse.json({ error: 'Missing participantId' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION).updateOne(
      { participantId },
      {
        $set: {
          college_checkin: 'Yes',
          college_checkin_time: new Date().toISOString(),
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}