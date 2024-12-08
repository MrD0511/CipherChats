from fastapi import WebSocket, APIRouter, Depends, HTTPException
from typing import Dict
from ..db import get_collection
from ..services import user_auth_services
from bson import ObjectId
import json
from ..services import user_auth_services,chat_service
from datetime import datetime

router = APIRouter()

user_collection = get_collection('user')
queued_messages_collection = get_collection('queued_messages')
channels_collection = get_collection('channels')

class connection_manager:

    def __init__(self):
        self.active_connections : Dict[str, WebSocket] = {}

    async def connect(self, websocket : WebSocket, id: str):
        await websocket.accept()
        self.active_connections[id] = websocket

    def disconnect(self, id):
        self.active_connections.pop(id, None)

    async def send_message(self, message, websocket: WebSocket):
        await websocket.send_json({
            "message" : message
        })

    async def send_e2ee_activation_notification(self, recipient_id: str, isE2ee : bool, channel_id : str, sender_id : str):
        if recipient_id in self.active_connections:
            recipient_socket = self.active_connections[recipient_id]
            await recipient_socket.send_json({ "event" : "e2ee_notification", "isE2ee" : isE2ee, "channel_id" : channel_id, "type" : "e2ee", "sender_id" : sender_id })
        else:
            await chat_service.queue_message(sender_id, recipient_id, { "isE2ee" : isE2ee, "channel_id" : channel_id }, 'e2ee')

    async def send_message_to_user(self, message: str, sender_id: str, recipient_id: str):
        if recipient_id in self.active_connections:
            recipient_socket = self.active_connections[recipient_id]
            await recipient_socket.send_json(message)
        elif message.get('message'):
            await chat_service.queue_message(sender_id, recipient_id, {"message" : message.get('message'), "timestamp" : message.get('timestamp'), "channel_id" : message.get('channel_id') }, 'message')

manager = connection_manager()

@router.websocket('/ws/chat')
async def chat_websocket(websocket : WebSocket):

    token = websocket.query_params.get("token")
    user = await user_auth_services.get_current_user(token)
    await manager.connect(websocket, user['sub'])
    try:

        pending_messages = await chat_service.get_pending_messages(user['sub'])
        for message in pending_messages:
            data = json.loads(message['message'])
            data['recipient_id'] = message['recipient_id']
            data['sender_id'] = message['sender_id']
            print(data)
            await websocket.send_json(data)
            queued_messages_collection.delete_one({ "_id" : ObjectId(message['_id']) })

        while True:
            data = await websocket.receive_text()
            data = json.loads(data)
            
            if data.get('message'):
                await manager.send_message_to_user({ "message" : data['message'], "sender_id" : user['sub'], "recipient_id" :  data['recipient_id'], "timestamp" : data.get('timestamp'), "channel_id" : data.get('channel_id') }, user['sub'], data['recipient_id'])
            
            elif data.get('event'):
                await manager.send_message_to_user({ "event" : data.get("event"), "sender_id" : user['sub'], "channel_id" : data.get('channel_id') }  , user['sub'], data['recipient_id'])
    except Exception as err:
        manager.disconnect(user['sub'])
        print(f"User disconnected", err)
