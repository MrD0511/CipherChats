from fastapi import FastAPI, WebSocket, HTTPException, Depends
from .db import client, get_collection
from typing import Dict
import json
from .models import UserModel, Token, SignInModel
from datetime import datetime, timedelta
from bson import ObjectId
from .services import user_auth_services, chat_service
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId, json_util
import pydantic

app = FastAPI()

origins = [
    "http://localhost:3000",  # Replace with your frontend URL
    # Add other allowed origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Or specify the methods you want to allow
    allow_headers=["*"],  # Or specify the headers you want to allow
)

user_collection = get_collection('user')
messages_collection = get_collection('messages')

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
        else:
            sender_socket = self.active_connections[sender_id]
            await sender_socket.send_text(f"User {recipient_id} is not available")

manager = connection_manager()

async def get_user_by_username(id : str):
    user_collection = get_collection('user')
    data = await user_collection.find_one({ "_id" : ObjectId(id) },{"_id", "email", "name", "username"})
    return data

@app.post('/signup', response_model=Token)
async def signup(user: UserModel):
    try:
        user_dict = user.dict()
        user_collection = get_collection('user')
        existing_user  = await user_collection.find_one({ 'email' : user_dict['email']})
        if existing_user:
            return HTTPException(status_code=400, detail="Email is already registered")
        
        hashed_password = user_auth_services.hash_password(user_dict['password'])
        user_dict['password_hash'] = hashed_password
        del user_dict['password']

        await user_collection.insert_one(user_dict)

        access_token = user_auth_services.create_access_token({ 'sub' : str(user_dict['_id'])})
        return {"access_token": access_token, "token_type": "bearer"}
    
    except Exception as e:
        print(e)
        return {"message" : "error"}
        

@app.post('/signin', response_model=Token)
async def signin(user : SignInModel):
    try:
        user_collection = get_collection('user')
        user_data = await user_collection.find_one({
            "$or": [
                {"email": user.identifier},
                {"username": user.identifier}
            ]
        })

        if user_data is None:
            raise HTTPException(status_code=400, detail="invalid credentials")

        if not user_auth_services.verify_password(user.password, user_data['password_hash']):
            raise HTTPException(status_code=400, detail="invalid credentials")
        
        access_token = user_auth_services.create_access_token(data={"sub": str(user_data['_id'])})
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException as http_exc:
        raise http_exc  # Re-raise HTTP exceptions to maintain status code
    except Exception as e:
        print("signin : ", e)
        raise HTTPException(status_code=500, detail="Internal server error")  # Raise an HTTPException for consistency

@app.get('/chat/get_chat/{id}')
async def get_chat(id : str, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        print(id)

        chat = await messages_collection.aggregate([
        # Step 1: Match messages where the user is either the sender or recipient
            {
                "$match": {
                    "$or": [
                        {"sender_id": id},
                        {"recipient_id": id}
                    ]
                }
            },
            # Step 2: Lookup to get user details for sender and recipient
            {
                "$lookup": {
                    "from": "users",  # Assuming the users collection is named "users"
                    "localField": "sender_id",  # Field from the chats collection
                    "foreignField": "_id",  # Field from the users collection
                    "as": "sender_details"  # Field name for the joined sender details
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "recipient_id",
                    "foreignField": "_id",
                    "as": "recipient_details"  # Field name for the joined recipient details
                }
            },
            # Step 3: Project the fields you want
            {
                "$project": {
                    "_id": 0,  # Exclude the default _id
                    "latest_message": 1,  # Include latest message
                    "sender_id": 1,
                    "sender_details": {
                        "username": {"$arrayElemAt": ["$sender_details.username", 0]},
                        "name": {"$arrayElemAt": ["$sender_details.name", 0]}
                    },
                    "recipient_id": 1,
                    "recipient_details": {
                        "username": {"$arrayElemAt": ["$recipient_details.username", 0]},
                        "name": {"$arrayElemAt": ["$recipient_details.name", 0]}
                    }
                }
            }
        ]).to_list()  # Convert cursor to list

        response = json.loads(json_util.dumps({ "chat" : chat }))
        return response

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("get_chat : ",e)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get('/chat/create')
async def create_chat(user : dict = Depends(user_auth_services.get_current_user)):
    try:
        
        keys_collection = get_collection('keys')
        user_data = await get_user_by_username(user['sub'])
        
        random_key = await chat_service.genrate_key()

        key = await keys_collection.insert_one({
            "key" : random_key,
            "user_id" : user_data['_id'],
            "createdAt" : datetime.now(),
            "updatedAt" : datetime.now()
        })

        return { "key" : random_key }
    
    except HTTPException as http_exc:
        raise http_exc  # Re-raise HTTP exceptions to maintain status code
    except Exception as e:
        print("create_chat : ",e)

@app.post('/chat/join')
async def join_chat(key : dict, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await get_user_by_username(user['sub'])
        keys_collection = get_collection('keys')
        key_record = await keys_collection.find_one({ "key" : key['key'] })

        if not key_record:
            raise HTTPException(status_code=404, detail="Key doesn't match.")
        
        await messages_collection.insert_one({
            "sender_id" : user_data['_id'],
            "recepient_id" : key_record['user_id'],
            "message" : "connected" ,
            "time_stamp" : datetime.now(),
            "type" : "system"
        }) 

        return { "message" : "Chat linked successfully. \nYou can send messaes now.",
                 "user_id" : str(key_record['user_id']) }
    
    except HTTPException as http_exc:
        raise http_exc  
    except Exception as e:
        print("join_chat : ",e)

@app.get('/chat/get_chats')
async def get_chats(user : dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await get_user_by_username(user['sub'])

        chats = await messages_collection.aggregate([
            # Step 1: Match messages where the user is either the sender or recipient
            {
                "$match": {
                    "$or": [
                        { "sender_id": user_data['_id'] },
                        { "recepient_id": user_data['_id'] }
                    ]
                }
            },
            # Step 2: Add a new field to identify who the partner (the other person) is
            {
                "$addFields": {
                    "partner_id": {
                        "$cond": [
                            { "$eq": ["$sender_id", user_data['_id']] },  # If user is the sender
                            "$recepient_id",                              # Get recipient's ID
                            "$sender_id"                                  # Else get sender's ID
                        ]
                    }
                }
            },
            # Step 3: Group by the partner_id to get unique chat participants
            {
                "$group": {
                    "_id": "$partner_id",          # Group by the ID of the partner
                    "latest_message": { "$last": "$$ROOT" }  # Optionally get the last message for each conversation
                }
            },
            # Step 4: Join with the users collection to get details of the partner
            {
                "$lookup": {
                    "from": "user",              # Assuming the users are stored in the "user" collection
                    "localField": "_id",          # Field from the current collection (partner_id)
                    "foreignField": "_id",        # Field from the "user" collection (_id of the partner)
                    "as": "partner_details"       # Field name for the joined partner details
                }
            },
            # Step 5: Unwind the user details (since $lookup returns an array)
            {
                "$unwind": "$partner_details"
            },
            # Step 6: Optionally project the fields you want (e.g., partner details and latest message)
            {
                "$project": {
                    "_id": 0,                         # Exclude the default _id
                    "partner_id": "$_id",              # Include the partner_id
                    "partner_details": 1,              # Include the partner details
                    "latest_message": 1                # Include the latest message for each unique chat participant
                }
            }
        ]).to_list()

        response = json.loads(json_util.dumps({ "chats" : chats }))
        return response
    
    except HTTPException as http_exc:
        raise http_exc  
    except Exception as e:
        print("get_chats : ",e)


@app.websocket('/ws/chat')
async def chat_websocket(websocket : WebSocket):

    token = websocket.query_params.get("token")
    user = await user_auth_services.get_current_user(token)
    await manager.connect(websocket, user['sub'])
    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data)
            await manager.send_message_to_user(data,user['sub'], data['recipient'])
    except Exception as err:
        print(err)
        # manager.disconnect(username)
        # print(f"User {username} disconnected")