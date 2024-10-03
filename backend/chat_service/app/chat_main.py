from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from .database import get_collection
from typing import Dict
import json
from bson import ObjectId, json_util
from .services import user_details as user_services, chat_service

import datetime
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

@app.get('/chat/get_chat/{id}')
async def get_chat(id : str, user : dict = Depends(user_services.get_current_user)):
    try:

        if id:
            sender_details = await user_collection.find_one({ "_id" : ObjectId(id) },{
                "password_hash": 0,
            })
        
        chat = await messages_collection.aggregate([
            # Step 1: Match messages where the user is either the sender or recipient
            {
                "$match": {
                    "$or": [
                        {"sender_id": ObjectId(user['sub']), "recipient_id": ObjectId(id) },
                        {"sender_id" : ObjectId(id), "recipient_id" : ObjectId(user['sub']) }
                    ]
                }
            },
            
        ]).to_list()  # Convert cursor to list


        response = json.loads(json_util.dumps({ "chat" : chat, "sender_details" : sender_details }))
        return response

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("get_chat : ",e)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get('/chat/create')
async def create_chat(user : dict = Depends(user_services.get_current_user)):
    try:
        
        keys_collection = get_collection('keys')
        user_data = await user_services.get_user_by_username(user['sub'])
        
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
async def join_chat(key : dict, user : dict = Depends(user_services.get_current_user)):
    try:
        user_data = await user_services.get_user_by_username(user['sub'])
        keys_collection = get_collection('keys')
        key_record = await keys_collection.find_one({ "key" : key['key'] })

        if not key_record:
            raise HTTPException(status_code=404, detail="Key doesn't match.")
        
        await messages_collection.insert_one({
            "sender_id" : user_data['_id'],
            "recipient_id" : key_record['user_id'],
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
async def get_chats(user : dict = Depends(user_services.get_current_user)):
    try:
        user_data = await user_services.get_user_by_username(user['sub'])

        chats = await messages_collection.aggregate([
            # Step 1: Match messages where the user is either the sender or recipient
            {
                "$match": {
                    "$or": [
                        { "sender_id": user_data['_id'] },
                        { "recipient_id": user_data['_id'] }
                    ]
                }
            },
            # Step 2: Add a new field to identify who the partner (the other person) is
            {
                "$addFields": {
                    "partner_id": {
                        "$cond": [
                            { "$eq": ["$sender_id", user_data['_id']] },  # If user is the sender
                            "$recipient_id",                              # Get recipient's ID
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
