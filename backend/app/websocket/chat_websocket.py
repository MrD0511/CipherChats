from fastapi import WebSocket, APIRouter, Depends, HTTPException
from typing import Dict
from ..db import get_collection
from ..services import user_auth_services
from bson import ObjectId
import json
from ..services import user_auth_services

router = APIRouter()

user_collection = get_collection('user')
messages_collection = get_collection('messages')
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

    async def send_message_to_user(self, message: str, sender_id: str, recipient_id: str):
        if recipient_id in self.active_connections:
            recipient_socket = self.active_connections[recipient_id]
            await recipient_socket.send_json(message)

manager = connection_manager()

@router.websocket('/ws/chat')
async def chat_websocket(websocket : WebSocket):

    token = websocket.query_params.get("token")
    user = await user_auth_services.get_current_user(token)
    await manager.connect(websocket, user['sub'])
    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data)
            
            if data.get('message'):
                await manager.send_message_to_user({ "message" : data['message'], "sender_id" : user['sub'], "recipient_id" :  data['recipient_id']}, user['sub'], data['recipient_id'])
            
            elif data.get('event'):
                await manager.send_message_to_user({ "event" : data.get("event"), "sender_id" : user['sub'] }  , user['sub'], data['recipient_id'])
    except Exception as err:
        manager.disconnect(user['sub'])
        # print(f"User {username} disconnected")
