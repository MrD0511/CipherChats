// src/services/webSocketService.js
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

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);  
      this.listeners.forEach((callback) => callback(message));
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      console.log('WebSocket connection closed');
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
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
        this.connect(this.url); // Attempt to reconnect
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
