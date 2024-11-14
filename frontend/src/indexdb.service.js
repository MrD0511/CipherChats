import Dexie from 'dexie';

// Create a new Dexie instance and define your database schema
const db = new Dexie('ChatApp');
db.version(1).stores({
  keys: 'channel_id, privateKey',
  isE2ee : 'channel_id, isActive',
  chat : '++id, channel_id, message, sender_id, recepient_id, timestamp, type'
});


async function addMessage(channel_id, message, sender_id, recepient_id, timestamp, type) {
  await db.chat.add({ channel_id, message, sender_id, recepient_id, timestamp, type });
}

async function getMessage(channel_id, size, number){
  return await db.chat.where('channel_id').equals(channel_id).offset(number * size)
  .limit(size)
  .reverse()
  .toArray();
}

async function getAllRecords(channel_id){
  return await db.chat.where('channel_id').equals(channel_id).toArray();
}


export { db, getMessage, getAllRecords, addMessage }
