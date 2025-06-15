import Dexie, { Table } from 'dexie';
import { Message } from './interfaces/Message';

// Define the Chat interface
export interface Chat {
  id?: number;
  message_id: string;
  channel_id: string;
  sender_id: string;
  recipient_id: string;
  type: "system" | "message" | "e2ee_status";
  sub_type: "enable" | "disable" | ""; // e.g., "message", "e2ee_status", etc.
  message: string;
  message_type: "text" | "image" | "video" | "audio" | "file" | "";
  file_name?: string;
  file_url?: string;
  status: "sent" | "delivered" | "read" | "unsent" | ""; // e.g., "sent", "delivered", "read"
  timestamp: string;
  file_size?: number;
  file_exp?: string;
  replied_message_id?: string; // Optional field for replied messages
}

// Extend Dexie to include the chat table
class ChatAppDexie extends Dexie {
  chat!: Table<Chat, number>;
  keys!: Table<{ channel_id: string; privateKey: string }>;
  isE2ee!: Table<{ channel_id: string; isActive: boolean }>;
  constructor() {
    super('ChatApp');
    this.version(1).stores({
      keys: 'channel_id, privateKey',
      isE2ee : 'channel_id, isActive',
      chat : '++id, message_id, channel_id, sender_id, recipient_id, type, sub_type, message, message_type, file_name, file_url, status, timestamp, file_size, file_exp, replied_message_id',
    });
  }
}

let db = new ChatAppDexie();


async function addMessage(message: Message) {
  await db.chat.add({ message_id: message.message_id, channel_id: message.channel_id, sender_id: message.sender_id, recipient_id: message.recipient_id, type: message.type, sub_type: message.sub_type || "", message: message.message, message_type: message.message_type, file_name: message.file_name, file_url: message.file_url, status: message.status || "", timestamp: message.timestamp, file_size: message.file_size, file_exp: message.file_exp, replied_message_id: message.replied_message_id });
}

async function getMessage(channel_id: string, size: number, number: number) {
  return await db.chat.where('channel_id').equals(channel_id).offset(number * size)
  .limit(size)
  .reverse()
  .toArray();
}

async function getAllRecords(channel_id: string) {
  return await db.chat.where('channel_id').equals(channel_id).toArray();
}

async function resetDb() {
  await db.delete().then(() => {
    console.log("IndexedDB deleted successfully");
  }).catch((error) => {
    console.error("Error deleting IndexedDB:", error);
  });
  db = new ChatAppDexie();
}

export { db, getMessage, getAllRecords, addMessage, resetDb }
