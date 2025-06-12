import EventEmitter from "events"
import { useContext, useRef, useState, useEffect, createContext, useCallback } from "react"
import { addMessage } from "./indexdb.service"
import encryptionService from "./encryption.service";
import { Message, sendingMessage } from "./interfaces/Message";


class eventEmitter extends EventEmitter {}

function useMessageHandler(){
    const messageQueue = useRef<any[]>([])
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
    
        if (!message) {
          isProcessingMessageQueue.current = false;
          handleMessageQueue();
          return;
        }
    
        try {
          
          let e2eeHandlerInstance = usersMap.current.get(message.channel_id)
    
          if(!e2eeHandlerInstance){
            e2eeHandlerInstance = new encryptionService(message.sender_id, message.channel_id);
            await e2eeHandlerInstance.initialize();
            usersMap.current.set(message.channel_id, e2eeHandlerInstance)

          }
    
          if (message.type == "message") {
    
              const decryptedMessage = await e2eeHandlerInstance.decryptMessage(message.message)
              if(activeChannel.current === message.channel_id) messageEmmiter.current.emit('onMessage', {id: message.id, channel_id: message.channel_id, sender_id: message.sender_id, recipient_id: message.recipient_id, type: message.type, sub_type: message.sub_type, message: decryptedMessage, message_type: message.message_type, file_name: message.file_name, file_url: message.file_url, timestamp: message.timestamp, file_exp: message.file_exp});
              const messageData : Message = {
                message_id: message.message_id,
                channel_id: message.channel_id,
                sender_id: message.sender_id,
                recipient_id: message.recipient_id,
                type: message.type,
                sub_type: message.sub_type || "",
                message: decryptedMessage,
                message_type: message.message_type,
                file_name: message.file_name,
                file_url: message.file_url,
                status: message.status || "",
                timestamp: message.timestamp,
                file_size: message.file_size,
                file_exp: message.file_exp
              };
              await addMessage(messageData);

          } else if (message.type == "e2ee_status") {
    
              await e2eeHandlerInstance.toggleE2ee(message.isE2ee)
              if(activeChannel.current === message.channel_id){
                messageEmmiter.current.emit('onMessage', { id: message.id, channel_id: message.channel_id, sender_id: message.sender_id, recipient_id: message.recipient_id, type: message.type, sub_type: message.sub_type, message: message.message, message_type: message.message_type, file_name: message.file_name, file_url: message.file_url, timestamp: message.timestamp, file_exp: message.file_exp});
                messageEmmiter.current.emit('onE2eeToggle', { status : message.isE2ee, type : "e2eeEvent" });
              } 
              const messageData : Message = {
                message_id: message.id,
                channel_id: message.channel_id,
                sender_id: message.sender_id,
                recipient_id: message.recipient_id,
                type: message.type,
                sub_type: message.sub_type || "",
                message: message.message,
                message_type: message.message_type,
                file_name: message.file_name,
                file_url: message.file_url,
                timestamp: message.timestamp,
                file_exp: message.file_exp
              };
              await addMessage(messageData);

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

    const handleSocketMessages = async (event: any) => {
        const receivedMessage = JSON.parse(event.data);
        console.log("Received message:", receivedMessage);
        messageQueue.current.push(receivedMessage);
    
        if (!isProcessingMessageQueue.current) {
          await handleMessageQueue();
        }
    };

    const getE2eeHandlerInstance = async (partner_id: string) => {

        let instance = usersMap.current.get(activeChannel.current);

        if(!instance){
          if (typeof activeChannel.current !== "string" || !activeChannel.current) {
            throw new Error("activeChannel.current is not a valid string");
          }
          instance = new encryptionService(partner_id, activeChannel.current);
          await instance.initialize();
          usersMap.current.set(activeChannel.current, instance);
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


const WebSocketContext = createContext<any>(null);

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

import { PropsWithChildren } from "react";

export const WebSocketProvider = ({ children }: PropsWithChildren<{}>) => {
  const socket = useRef<WebSocket | null>(null);
  const listeners = useRef(new Map());
  const reconnectInterval = useRef(5000); // 5 seconds initial reconnect interval
  const maxReconnectAttempts = useRef(10); // Max number of reconnect attempts
  const reconnectAttempts = useRef(0); // Track the number of reconnect attempts
  const isConnected = useRef(false);
  const url = useRef<string | null>(null);
  const shouldReconnect = useRef(true);
  const [connectionState, setConnectionState] = useState(false);
  const messageHandler = useMessageHandler(); // Using the message handler

  const connectRef = useRef<any>(null);

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

  const connect = useCallback((connectionUrl: string) => {
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
      if (socket.current) {
        socket.current.close();
      }
    };
  },[messageHandler, reconnect]);


  useEffect(() => {
    const url = import.meta.env.VITE_WEBSOCKET_URL;
    const token = localStorage.getItem('access_token')
    connect(`${url}/ws/chat?token=${token}`)
  }, [connect]); // Empty dependency array ensures it only runs once when the hook is mounted

  const sendMessage = async (message: sendingMessage) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      console.log("send message: "+ message.type);
        try {

            const instance = await messageHandler.getE2eeHandlerInstance(message.recipient_id);
            const encryptedMessage = await instance.encryptMessage(message.message);
            
            const data = {
                message_id: message.message_id,
                channel_id: message.channel_id,
                recipient_id: message.recipient_id,
                type: message.type,
                sub_type: message.sub_type,
                message: encryptedMessage,
                message_type: message.message_type,
                timestamp: message.timestamp,
                file_name: message.file_name,
                file_url: message.file_url,
                file_exp: message.file_exp
            };

            socket.current.send(JSON.stringify(data));
        } catch (error) {
            console.error("Error sending message:", error);
        }
    } else {
        console.error('WebSocket is not open. Message not sent.');
    }
  };

  const sendEvent = async (data: any) => {
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

  const addListener = (callback: (data: any) => void) => {
    const id: symbol = Symbol();
    listeners.current.set(id, callback);
    return id;
  };

  const removeListener = (id: symbol) => {
    listeners.current.delete(id);
  };

  const disconnect = () => {
    shouldReconnect.current = false;
    if (socket.current) {
      socket.current.close();
    }
  };

  const enable_e2ee = async () => {
    if (typeof messageHandler.activeChannel.current !== "string" || !messageHandler.activeChannel.current) {
      console.error("activeChannel.current is not a valid string");
      return;
    }
    const instance = await messageHandler.getE2eeHandlerInstance(messageHandler.activeChannel.current);
    await instance.enableE2ee();
  };

  const disable_e2ee = async () => {
    if (typeof messageHandler.activeChannel.current !== "string" || !messageHandler.activeChannel.current) {
      console.error("activeChannel.current is not a valid string");
      return;
    }
    const instance = await messageHandler.getE2eeHandlerInstance(messageHandler.activeChannel.current);
    await instance.disableE2ee();
  };

  const toggle_e2ee = async (isE2ee: boolean) => {
    if (typeof messageHandler.activeChannel.current !== "string" || !messageHandler.activeChannel.current) {
      console.error("activeChannel.current is not a valid string");
      return;
    }
    const instance = await messageHandler.getE2eeHandlerInstance(messageHandler.activeChannel.current);
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