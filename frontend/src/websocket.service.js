// src/services/webSocketService.js

import encryptionService from "./encryption.service";
import { addMessage } from "./indexdb.service";
import {EventEmitter} from 'events';

class eventEmitter extends EventEmitter {}

class MessageHandler{

  usersMap = new Map();

  constructor(){
    this.messageQueue = [];
    this.handleSocketMessages = this.handleSocketMessages.bind(this);
    this.isProcessingMessageQueue = false;
    this.activeChannel = null;
    this.messageEmmiter = new eventEmitter();
  }


  async handleMessageQueue(){

    if(this.messageQueue.length === 0){
      this.isProcessingMessageQueue = false;
      return;
    }
    
    this.isProcessingMessageQueue = true;
    let message = this.messageQueue.shift();

    try {
      
      let e2eeHandlerInstance = this.usersMap.get(message.channel_id)

      if(!e2eeHandlerInstance){
        e2eeHandlerInstance = new encryptionService(message.sender_id, message.channel_id);
        await e2eeHandlerInstance.initialize();
        this.usersMap.set(message.channel_id, e2eeHandlerInstance)
      }

      if (message.message) {

          const decryptedMessage = await e2eeHandlerInstance.decryptMessage(message.message)
          if(this.activeChannel === message.channel_id) this.messageEmmiter.emit('onMessage', { "message" : decryptedMessage, sender_id: message.sender_id, recipient_id : message.recipient_id, type:"message", timestamp: message.timestamp });
          await addMessage(message.channel_id, decryptedMessage, message.sender_id, message.recipient_id, message.timestamp, "message")
        
      } else if (message.isE2ee !== undefined) {

          await e2eeHandlerInstance.toggleE2ee(message.isE2ee)
          if(this.activeChannel === message.channel_id) this.messageEmmiter.emit('onMessage', { message : message.isE2ee ? "End to end encryption Enabled" : "End to end encryption Disabled", type : "status" });
          await addMessage(message.channel_id, message.isE2ee ? "End to end encryption Enabled" : "End to end encryption Disabled", null, null, null, 'status');
      
        } else if (message.event) {
          console.log("typing")
      }

    } catch (err) {
          console.error("Error processing queue:", err);
    }finally{
      this.isProcessingMessageQueue = false;
      this.handleMessageQueue();
    }
  }

  async handleSocketMessages(event){
    const receivedMessage = JSON.parse(event.data);
    this.messageQueue.push(receivedMessage);

    await this.handleMessageQueue(); 
  }

}


class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectInterval = 5000; // 5 seconds initial reconnect interval
    this.maxReconnectAttempts = 10; // Max number of reconnect attempts
    this.reconnectAttempts = 0; // Track the number of reconnect attempts
    this.isConnected = false;
    this.url = null;
    this.shouldReconnect = true;
    this.messageHandler = new MessageHandler()
  }

  getE2EEKeys(userId) {
    return this.e2eeKeys.get(userId);
  }

  connect(url) {
    this.url = url;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0; // Reset reconnect attempts on each new connection attempt

    // Create the WebSocket connection
    this.socket = new WebSocket(url);

    // Set up WebSocket event handlers
    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset reconnection attempts after successful connection
      console.log('WebSocket connection established');
    };

    this.socket.onmessage = (event) => this.messageHandler.handleSocketMessages;

    this.socket.onclose = () => {
      this.isConnected = false;
      console.log('WebSocket connection closed');
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        // this.reconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.socket.close();
    };
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay / 1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    setTimeout(() => {
      if (this.shouldReconnect) {
        console.log('Reconnecting...');
        // this.connect(this.url); // Attempt to reconnect
      }
    }, delay);
  }

  // Method to send a message through WebSocket
  sendMessage(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not open. Message not sent:', data);
    }
  }

  // Subscribe to WebSocket messages
  addListener(callback) {
    const id = Symbol();
    this.listeners.set(id, callback);
    return id;
  }

  // Unsubscribe a specific listener
  removeListener(id) {
    this.listeners.delete(id);
  }

  // Close the WebSocket connection and disable auto-reconnect
  disconnect() {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.close();
    }
  }
}

const webSocketService = new WebSocketService();

export default webSocketService;

