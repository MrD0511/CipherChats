import EventEmitter from "events"
import { useContext, useRef, useState, useEffect, createContext, useCallback } from "react"
import { addMessage } from "./indexdb.service"
import encryptionService from "./encryption.service";

class eventEmitter extends EventEmitter {}

function useMessageHandler(){
    const messageQueue = useRef([])
    const isProcessingMessageQueue = useRef(false)
    const activeChannel = useRef(null)
    const messageEmmiter = useRef(new eventEmitter())
    const usersMap = useRef(new Map())

    const handleMessageQueue = async () => {

        if(messageQueue.current.length === 0){
            isProcessingMessageQueue.current = false;
            return;
        }
        
        isProcessingMessageQueue.current = true;
        let message = messageQueue.current.shift();
    
        try {
          
          let e2eeHandlerInstance = usersMap.current.get(message.channel_id)
    
          if(!e2eeHandlerInstance){
            e2eeHandlerInstance = new encryptionService(message.sender_id, message.channel_id);
            await e2eeHandlerInstance.initialize();
            usersMap.current.set(message.channel_id, e2eeHandlerInstance)

          }
    
          if (message.message) {
    
              const decryptedMessage = await e2eeHandlerInstance.decryptMessage(message.message)
              if(activeChannel.current === message.channel_id) messageEmmiter.current.emit('onMessage', { "message" : decryptedMessage, sender_id: message.sender_id, recipient_id : message.recipient_id, type:"message", timestamp: message.timestamp });
              await addMessage(message.channel_id, decryptedMessage, message.sender_id, message.recipient_id, message.timestamp, "message")
            
          } else if (message.isE2ee !== undefined) {
    
              await e2eeHandlerInstance.toggleE2ee(message.isE2ee)
              if(activeChannel.current === message.channel_id){
                messageEmmiter.current.emit('onMessage', { message : message.isE2ee ? "End to end encryption Enabled" : "End to end encryption Disabled", type : "status" });
                messageEmmiter.current.emit('onE2eeToggle', { status : message.isE2ee, type : "e2eeEvent" });
              } 
              await addMessage(message.channel_id, message.isE2ee ? "End to end encryption Enabled" : "End to end encryption Disabled", null, null, null, 'status');
          
          } else if (message.event) {
            if(activeChannel.current === message.channel_id) messageEmmiter.current.emit('onEvent', message);
          }
    
        } catch (err) {
              console.error("Error processing queue:", err);
        }finally{
          isProcessingMessageQueue.current = false;
          handleMessageQueue();
        }
    }

    const handleSocketMessages = async (event) => {
        const receivedMessage = JSON.parse(event.data);
        messageQueue.current.push(receivedMessage);
    
        if (!isProcessingMessageQueue.current) {
          await handleMessageQueue();
        }
    };

    const getE2eeHandlerInstance = async (partner_id) => {

        let instance = usersMap.current.get(activeChannel.current)

        if(!instance){
          instance = new encryptionService(partner_id, activeChannel.current);
          await instance.initialize();
          usersMap.current.set(activeChannel.current, instance)
        }

        return instance;
    } 

    return {
        usersMap,
        messageQueue,
        isProcessingMessageQueue,
        activeChannel,
        getE2eeHandlerInstance,
        messageEmitter: messageEmmiter.current,
        handleMessageQueue,
        handleSocketMessages,
    };
}


const WebSocketContext = createContext();

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const socket = useRef(null);
  const listeners = useRef(new Map());
  const reconnectInterval = useRef(5000); // 5 seconds initial reconnect interval
  const maxReconnectAttempts = useRef(10); // Max number of reconnect attempts
  const reconnectAttempts = useRef(0); // Track the number of reconnect attempts
  const isConnected = useRef(false);
  const url = useRef(null);
  const shouldReconnect = useRef(true);
  const [connectionState, setConnectionState] = useState(false);
  const messageHandler = useMessageHandler(); // Using the message handler

  const connectRef = useRef();

  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts.current) {
      console.log('Max reconnect attempts reached. Giving up.');
      return;
    }

    reconnectAttempts.current++;
    const delay =
      reconnectInterval.current * Math.pow(2, reconnectAttempts.current); // Exponential backoff

    console.log(
      `Attempting to reconnect in ${delay / 1000} seconds... (Attempt ${
        reconnectAttempts.current
      }/${maxReconnectAttempts.current})`
    );

    setTimeout(() => {
      if (shouldReconnect.current) {
        console.log('Reconnecting...');
        // connect(url.current); // Attempt to reconnect
        connectRef.current?.(url.current);
      }
    }, delay);
  },[]);

  const connect = useCallback((connectionUrl) => {
    url.current = connectionUrl;
    shouldReconnect.current = true;
    reconnectAttempts.current = 0; // Reset reconnect attempts on each new connection attempt

    // Create the WebSocket connection
    socket.current = new WebSocket(connectionUrl);

    // Set up WebSocket event handlers
    socket.current.onopen = () => {
      isConnected.current = true;
      reconnectAttempts.current = 0; // Reset reconnection attempts after successful connection
      console.log('WebSocket connection established');
      setConnectionState(true);
    };

    socket.current.onmessage = (event) => {
      messageHandler.handleSocketMessages(event); // Using the message handler
    };

    socket.current.onclose = () => {
      isConnected.current = false;
      console.log('WebSocket connection closed');
      setConnectionState(false);
      if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts.current) {
        reconnect();
      }
    };

    socket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket.current.close();
    };
  },[messageHandler, reconnect]);


  useEffect(() => {
    const url = process.env.REACT_APP_WEBSOCKET_URL;
    const token = localStorage.getItem('access_token')
    connect(`${url}/ws/chat?token=${token}`)
  }, [connect]); // Empty dependency array ensures it only runs once when the hook is mounted

  const sendMessage = async (message, recipient_id, timestamp, channel_id ) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        try {

            const instance = await messageHandler.getE2eeHandlerInstance(recipient_id);
            const encryptedMessage = await instance.encryptMessage(message);
            
            const data = {
                message: encryptedMessage,
                recipient_id : recipient_id,
                type : "message",
                timestamp : timestamp,
                channel_id : channel_id
            };

            socket.current.send(JSON.stringify(data));
        } catch (error) {
            console.error("Error sending message:", error);
        }
    } else {
        console.error('WebSocket is not open. Message not sent.');
    }
  };

  const sendEvent = async (data) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      try {
        socket.current.send(JSON.stringify(data));
      } catch (error) {
        console.error("Error sending event:", error);
      }
    } else {
      console.error('WebSocket is not open. Event not sent.');
    }
  };

  const addListener = (callback) => {
    const id = Symbol();
    listeners.current.set(id, callback);
    return id;
  };

  const removeListener = (id) => {
    listeners.current.delete(id);
  };

  const disconnect = () => {
    shouldReconnect.current = false;
    if (socket.current) {
      socket.current.close();
    }
  };

  const enable_e2ee = async () => {
    const instance = await messageHandler.getE2eeHandlerInstance(messageHandler.activeChannel.current)
    await instance.enableE2ee();
  };

  const disable_e2ee = async () => {
    const instance = await messageHandler.getE2eeHandlerInstance(messageHandler.activeChannel.current)
    await instance.disableE2ee();
  };

  const toggle_e2ee = async (isE2ee) => {
    const instance = await messageHandler.getE2eeHandlerInstance(messageHandler.activeChannel.current)
    await instance.toggleE2ee(isE2ee);
  };

  return (
    <WebSocketContext.Provider
      value={{
        connect,
        reconnect,
        sendMessage,
        messageHandler : messageHandler,
        messageEmmiter : messageHandler.messageEmitter,
        activeChannel : messageHandler.activeChannel,
        addListener,
        removeListener,
        disconnect,
        isConnected: connectionState,
        url,
        enable_e2ee,
        disable_e2ee,
        toggle_e2ee,
        sendEvent
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};