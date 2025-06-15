from fastapi import WebSocket, APIRouter
from typing import Dict
from ..db import get_collection
from ..services import user_auth_services
from bson import ObjectId
import json
from ..services import user_auth_services,chat_service

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
        print(f"Sending message from {sender_id} to {recipient_id}")
        if recipient_id in self.active_connections:
            print(f"Recipient {recipient_id} is online, sending message directly.")
            recipient_socket = self.active_connections[recipient_id]
            await recipient_socket.send_json(message)
        else:
            print(f"Queuing message for {recipient_id} from {sender_id}")
            await chat_service.queue_message(message)

manager = connection_manager()

@router.websocket('/ws/chat')
async def chat_websocket(websocket : WebSocket):

    token = websocket.query_params.get("token")
    user = await user_auth_services.get_current_user(token)
    print(f"User connected: {user['sub']}")
    await manager.connect(websocket, user['sub'])
    try:

        pending_messages = await chat_service.get_pending_messages(user['sub'])
        for message in pending_messages:
            id = message['_id']
            message.pop('_id', None)  # Remove _id from the message before sending
            await websocket.send_json(message)
            queued_messages_collection.delete_one({ "_id" : ObjectId(id) })

        while True:
            data = await websocket.receive_text()
            data = json.loads(data)
            
            if(data.get("message_type")):
                await manager.send_message_to_user({"message_id": data.get('message_id'), "channel_id": data['channel_id'], "sender_id" : user['sub'], "recipient_id" :  data['recipient_id'], "type": data.get('type'), "sub_type": data.get('sub_type'), "message": data.get('message'), "message_type": data.get('message_type'), "file_name": data.get('file_name'), "file_url": data.get('file_url'), "timestamp" : data.get('timestamp'), "file_exp" : data.get('file_exp'), "file_size": data.get('file_size'), "replied_message_id": data.get('replied_message_id')}, user['sub'], data['recipient_id'])
            elif data.get("event"):
                await manager.send_message_to_user(data, user['sub'], data['recipient_id'])                

    except Exception as err:
        manager.disconnect(user['sub'])
        print(f"User disconnected", err)
