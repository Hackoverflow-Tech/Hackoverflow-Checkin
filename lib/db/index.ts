/**
 * Database Module Exports
 *
 * @module lib/db
 * @description Centralized database exports for clean imports
 */

// MongoDB connection
export {
  getClientPromise,
  getDatabase,
  getDatabaseName,
} from './mongodb';

// Participant operations
export {
  getParticipantByEmail,
  getParticipantById,
  getAllParticipants,
  getParticipantsPaginated,
  countParticipants,
  updateCheckIn,
  resetCheckIn,
  participantExists,
  getCollectionInfo,
  updateMealStatus,
  getParticipantsByTeamId, // <--- THIS FIXES THE TERMINAL ERROR
} from './participants';