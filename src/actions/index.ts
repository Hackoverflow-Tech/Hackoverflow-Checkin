'use server';

// src/actions/index.ts

import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const DB_NAME    = 'hackoverflow';
const COLLECTION = 'participants';

// ─── helpers ──────────────────────────────────────────────────────────────────

function serialize(doc: any): any {
  return JSON.parse(
    JSON.stringify(doc, (_key, val) => {
      if (val && typeof val === 'object' && val.constructor?.name === 'ObjectId')
        return val.toString();
      if (val instanceof Date) return val.toISOString();
      return val;
    })
  );
}

// ─── GET TEAM (used by team page) ─────────────────────────────────────────────

export async function getTeamAction() {
  // 1. Read cookie server-side
  const cookieStore = await cookies();
  const token = cookieStore.get('participant_token')?.value;
  if (!token) return { error: 'not_authenticated' as const, team: null };

  // 2. Verify token
  const payload = verifyToken(token);
  if (!payload) return { error: 'invalid_token' as const, team: null };

  const participantId: string =
    (payload as any).participantId ??
    (payload as any).id ??
    (payload as any).sub ??
    '';

  if (!participantId) return { error: 'no_participant_id' as const, team: null };

  // 3. Hit DB directly
  const client = await clientPromise;
  const db     = client.db(DB_NAME);

  const self = await db.collection(COLLECTION).findOne({ participantId });
  if (!self)    return { error: 'participant_not_found' as const, team: null };
  if (!self.teamId) return { error: null, team: null };

  const teamDocs = await db
    .collection(COLLECTION)
    .find({ teamId: self.teamId })
    .toArray();

  if (!teamDocs.length) return { error: null, team: null };

  const safe = teamDocs.map(d => {
    const { loginPassword: _, ...rest } = d as any;
    return serialize(rest);
  });

  const toMember = (d: any) => ({
    id:             d.participantId,
    name:           d.name,
    email:          d.email          ?? null,
    role:           d.role           ?? null,
    github:         d.github         ?? null,
    linkedin:       d.linkedin       ?? null,
    labAllotted:    d.labAllotted    ?? null,
    collegeCheckIn: d.collegeCheckIn ?? null,
    labCheckIn:     d.labCheckIn     ?? null,
  });

  const leaderDoc =
    safe.find((d: any) => d.role?.toLowerCase() === 'leader') ??
    safe.find((d: any) => d.participantId === participantId) ??
    safe[0];

  const leader  = toMember(leaderDoc);
  const members = safe
    .filter((d: any) => d.participantId !== leaderDoc.participantId)
    .map(toMember);

  const withProject = safe.find((d: any) => d.projectName) ?? safe[0];

  const team = {
    teamId:             self.teamId,
    teamName:           (self.teamName as string) ?? `Team ${self.teamId}`,
    projectName:        withProject.projectName        ?? null,
    projectDescription: withProject.projectDescription ?? null,
    techStack:          withProject.techStack          ?? [],
    githubRepo:         withProject.githubRepo         ?? null,
    leader,
    members,
  };

  return { error: null, team };
}

// ─── CHECK-IN / CHECK-OUT ACTIONS ─────────────────────────────────────────────

export async function collegeCheckInAction(participantId: string) {
  const client = await clientPromise;
  const db     = client.db(DB_NAME);
  await db.collection(COLLECTION).updateOne(
    { participantId },
    { $set: { 'collegeCheckIn.status': true, 'collegeCheckIn.time': new Date(), updatedAt: new Date() } }
  );
}

export async function labCheckInAction(participantId: string) {
  const client = await clientPromise;
  const db     = client.db(DB_NAME);
  await db.collection(COLLECTION).updateOne(
    { participantId },
    { $set: { 'labCheckIn.status': true, 'labCheckIn.time': new Date(), updatedAt: new Date() } }
  );
}

export async function labCheckOutAction(participantId: string) {
  const client = await clientPromise;
  const db     = client.db(DB_NAME);
  await db.collection(COLLECTION).updateOne(
    { participantId },
    { $set: { 'labCheckOut.status': true, 'labCheckOut.time': new Date(), updatedAt: new Date() } }
  );
}

export async function tempLabCheckOutAction(participantId: string) {
  const client = await clientPromise;
  const db     = client.db(DB_NAME);
  await db.collection(COLLECTION).updateOne(
    { participantId },
    { $set: { 'tempLabCheckOut.status': true, 'tempLabCheckOut.time': new Date(), updatedAt: new Date() } }
  );
}

export async function collegeCheckOutAction(participantId: string) {
  const client = await clientPromise;
  const db     = client.db(DB_NAME);
  await db.collection(COLLECTION).updateOne(
    { participantId },
    { $set: { 'collegeCheckOut.status': true, 'collegeCheckOut.time': new Date(), updatedAt: new Date() } }
  );
}