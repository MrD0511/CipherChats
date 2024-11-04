import Dexie from 'dexie';

// Create a new Dexie instance and define your database schema
const db = new Dexie('ChatApp');
db.version(1).stores({
  keys: 'channel_id, privateKey',
  isE2ee : 'channel_id, isActive'
});

// Functions for CRUD operations
async function addRecord(channel_id, privateKey) {
  await db.keys.put({ channel_id, privateKey });
}

async function getRecord(channel_id) {
  return await db.keys.get(channel_id);
}

async function getAllRecords() {
  return await db.keys.toArray();
}

async function deleteRecord(channel_id) {
  await db.keys.delete(channel_id);
}

export {addRecord, getAllRecords, getRecord, deleteRecord, db}
