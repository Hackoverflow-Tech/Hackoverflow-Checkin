import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

const DB_NAME = 'hackoverflow';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('participant_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { subscription } = await req.json();
    if (!subscription) return NextResponse.json({ error: 'No subscription' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    await db.collection('push_subscriptions').updateOne(
      { participantId: payload.participantId },
      {
        $set: {
          participantId: payload.participantId,
          name: payload.name,
          subscription,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}