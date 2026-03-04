/**
 * Participant Database Operations
 *
 * @module lib/db/participants
 * @description Type-safe database operations for participants collection
 */

import { getDatabase } from './mongodb';
import {
  DBParticipant,
  DBParticipantSchema,
  CheckInType,
  toClientParticipant,
  ClientParticipant,
} from '../types';

const COLLECTION_NAME = 'participants';

export async function getParticipantByEmail(email: string): Promise<DBParticipant | null> {
  const db = await getDatabase();
  const document = await db.collection(COLLECTION_NAME).findOne({ email: email.toLowerCase() });
  if (!document) return null;
  const parseResult = DBParticipantSchema.safeParse(document);
  if (!parseResult.success) {
    console.error('Invalid participant document:', parseResult.error);
    return null;
  }
  return parseResult.data;
}

export async function getParticipantById(participantId: string): Promise<DBParticipant | null> {
  const db = await getDatabase();
  const document = await db.collection(COLLECTION_NAME).findOne({ participantId });
  if (!document) return null;
  const parseResult = DBParticipantSchema.safeParse(document);
  if (!parseResult.success) {
    console.error('Invalid participant document:', parseResult.error);
    return null;
  }
  return parseResult.data;
}

export async function getAllParticipants(limit?: number): Promise<DBParticipant[]> {
  const db = await getDatabase();
  const cursor = db.collection(COLLECTION_NAME).find({});
  if (limit && limit > 0) cursor.limit(limit);
  const documents = await cursor.toArray();
  const participants: DBParticipant[] = [];
  for (const doc of documents) {
    const parseResult = DBParticipantSchema.safeParse(doc);
    if (parseResult.success) participants.push(parseResult.data);
  }
  return participants;
}

export async function getParticipantsPaginated(page: number, pageSize: number): Promise<{ participants: ClientParticipant[]; total: number; pages: number }> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);
  const total = await collection.countDocuments();
  const pages = Math.ceil(total / pageSize);
  const skip = (page - 1) * pageSize;
  const documents = await collection.find({}).skip(skip).limit(pageSize).toArray();
  const participants: ClientParticipant[] = [];
  for (const doc of documents) {
    const parseResult = DBParticipantSchema.safeParse(doc);
    if (parseResult.success) participants.push(toClientParticipant(parseResult.data));
  }
  return { participants, total, pages };
}

export async function countParticipants(): Promise<number> {
  const db = await getDatabase();
  return db.collection(COLLECTION_NAME).countDocuments();
}

export async function getParticipantsByTeamId(teamId: string): Promise<DBParticipant[]> {
  const db = await getDatabase();
  const documents = await db.collection(COLLECTION_NAME).find({ teamId }).toArray();
  const participants: DBParticipant[] = [];
  for (const doc of documents) {
    const parseResult = DBParticipantSchema.safeParse(doc);
    if (parseResult.success) participants.push(parseResult.data);
  }
  return participants;
}

export async function updateCheckIn(participantId: string, checkInType: CheckInType): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection(COLLECTION_NAME).updateOne(
    { participantId },
    { $set: { [`${checkInType}.status`]: true, [`${checkInType}.time`]: new Date(), updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function resetCheckIn(participantId: string, checkInType: CheckInType): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection(COLLECTION_NAME).updateOne(
    { participantId },
    { $set: { [`${checkInType}.status`]: false, [`${checkInType}.time`]: null, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function updateMealStatus(participantId: string, mealKey: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection(COLLECTION_NAME).updateOne(
    { participantId },
    { $set: { [`mealStatus.${mealKey}.status`]: true, [`mealStatus.${mealKey}.time`]: new Date(), updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function participantExists(participantId: string): Promise<boolean> {
  const db = await getDatabase();
  const count = await db.collection(COLLECTION_NAME).countDocuments({ participantId }, { limit: 1 });
  return count > 0;
}

export async function getCollectionInfo(): Promise<{ name: string; count: number }> {
  const db = await getDatabase();
  const count = await db.collection(COLLECTION_NAME).countDocuments();
  return { name: COLLECTION_NAME, count };
}