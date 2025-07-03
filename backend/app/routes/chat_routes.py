from fastapi import APIRouter
from fastapi import Depends, HTTPException
from ..db import get_collection
from ..services import user_auth_services, clean_get_chats_doc, clean_object_ids
from bson import ObjectId, json_util
import json
from datetime import datetime
from ..services import chat_service
from ..models import store_public_key_model, get_public_key_model, create_channel_model, create_channel_response_model, edit_key_note_model
from ..websocket import manager

router = APIRouter()

user_collection = get_collection('user')
messages_collection = get_collection('messages')
public_keys_collection = get_collection('public_keys')
channels_collection = get_collection('channels')
joining_requests_collection = get_collection('joining_requests')


@router.post('/chat/store_public_key')
async def store_public_key(request : store_public_key_model, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await user_auth_services.get_user_by_id(user['sub'])
        request = request.dict()

        channel_exists = await channels_collection.find_one({"_id" : ObjectId(request['channel_id'])}, {"_id" : 1})

        if not channel_exists:
            raise HTTPException(status_code=404, detail="Channel not found")

        public_key_exists = await public_keys_collection.find_one({ 'user_id' : ObjectId(user_data['_id']), 'channel_id' : ObjectId(request['channel_id']) })

        if public_key_exists: 
            await public_keys_collection.update_one({
                "user_id" : ObjectId(str(user_data['_id'])),
                "channel_id" : ObjectId(request['channel_id'])
            },{
                "$set" : {
                    "public_key" : request['public_key']
                }
            })

            partner_id = await channels_collection.aggregate([
                # Step 1: Match messages where the user is either the sender or recipient
                {
                    "$match": {
                        "_id" : ObjectId(request['channel_id'])
                    }
                },
                # Step 2: Add a new field to identify who the partner (the other person) is
                {
                    "$addFields": {
                        "partner_id": {
                            "$cond": [
                                { "$eq": ["$user_id", user_data['_id']] },  # If user is the sender
                                "$partner_id",                              # Get recipient's ID
                                "$user_id"                                  # Else get sender's ID
                            ]
                        }
                    }
                },
                # Step 3: Group by the partner_id to get unique chat participants
                {
                    "$group": {
                        "_id": "$partner_id",          # Group by the ID of the partner
                    }
                },
                # Step 5: Optionally project the fields you want (e.g., partner details and latest message)
                {
                    "$project": {
                        "_id": 0,                         # Exclude the default _id
                        "partner_id": "$_id"
                    }
                }
            ]).to_list()
            

            await manager.send_message_to_user(
                {
                    "event": "update_public_key",
                    "sender_id": str(user["sub"]),
                    "channel_id": str(request['channel_id']),
                    "recipient_id": str(partner_id[0]['partner_id']) if partner_id else None,
                }, str(user['sub']), str(partner_id[0]['partner_id']) if partner_id else None
            )
        else:
            await public_keys_collection.insert_one({
                "user_id" : ObjectId(str(user_data['_id'])),
                "public_key" : request['public_key'],
                "channel_id" : ObjectId(request['channel_id']),
                "createdAt" : datetime.now()
            })

        return {
            "msg" : "Key stored successfully"
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("store_public_key : ", e.with_traceback())
        raise HTTPException(status_code=500, detail="Internal error")


@router.post('/chat/get_public_key')
async def get_public_key(request : get_public_key_model, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        request = request.dict()
        # user_data = await user_auth_services.get_user_by_id(user['sub'])
        partner_exists = await user_collection.find_one({ "_id" : ObjectId(request['partner_id'])}, {"_id" : 1})
        
        if not partner_exists:
            raise HTTPException(status_code=404, detail="Partner not found")
            
        partner_public_key = await public_keys_collection.find_one({ 
            "channel_id" : ObjectId(request['channel_id']), "user_id": ObjectId(request["partner_id"])
        })

        if not partner_public_key:
            raise HTTPException(status_code=404, detail="Partner public key not found")
        
        return {
            "success": True,
            "public_key": str(partner_public_key["public_key"])
        }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("get_public_key: ",e)
        raise HTTPException(status_code=500, detail="Internal error")
    

@router.get('/chat/get_chat/{id}')
async def get_chat(id : str, user : dict = Depends(user_auth_services.get_current_user)):
    try:

        if id:
            sender_details = await user_collection.find_one({ "_id" : ObjectId(id) },{
                "password_hash": 0,
            })

        channelExists = await channels_collection.find_one({
            "$or": [
                {"user_id": ObjectId(user['sub']), "partner_id": ObjectId(id) },
                {"user_id" : ObjectId(id), "partner_id" : ObjectId(user['sub']) }
            ]
        },{ "_id" : 1, "is_e2ee" : 1})

        if not channelExists:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        response = json.loads(json_util.dumps({"sender_details" : sender_details, "channel_id" : str(channelExists["_id"]), "isE2ee" : channelExists.get('is_e2ee') }))
        return response

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("get_chat : ",e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post('/chat/create', response_model=create_channel_response_model)
async def create_chat(create_channel: create_channel_model, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        
        user_data = await user_auth_services.get_user_by_id(user['sub'])

        if(user_data["role"] == "guest"):
            raise HTTPException(status_code=403, detail="Guests cannot create new chats.")
        
        random_key = await chat_service.genrate_key()

        channel = await channels_collection.insert_one({
            "key" : random_key,
            "user_id" : user_data['_id'],
            "note" : create_channel.note,
            "created_at" : datetime.now()
        })

        return { "key" : random_key, "channel_id" : str(channel.inserted_id)}
    
    except HTTPException as http_exc:
        raise http_exc  # Re-raise HTTP exceptions to maintain status code
    except Exception as e:
        print("create_chat : ",e)


@router.post('/chat/join')
async def join_chat(key : dict, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await user_auth_services.get_user_by_id(user['sub'])

        if(user_data["role"] == "guest"):
            raise HTTPException(status_code=403, detail="Guests cannot join chats.")

        channel_record = await channels_collection.find_one({ "key" : key['key'] })

        if not channel_record:
            raise HTTPException(status_code=404, detail="Key doesn't match.") 
        
        if channel_record['user_id'] == user_data['_id']:
            raise HTTPException(status_code=400, detail="You cannot join your own channel.")
        
        recordExists = await joining_requests_collection.find_one({ 
            "channel_id": channel_record["_id"],
            "user_id": user_data["_id"]
        })

        if(recordExists == None):
            await joining_requests_collection.insert_one({ 
                "channel_id": channel_record["_id"],
                "user_id": user_data["_id"]
            })

        res = { "success": True, 
                "message" : "A request have been sent to the owner. Please wait for the response",
                "channel_id": channel_record['_id'],
                "partner_id": channel_record["user_id"]
             }
        
        return clean_object_ids(res)
    
    except HTTPException as http_exc:
        raise http_exc  
    except Exception as e:
        print("join_chat : ",e)


@router.get('/chat/get_chats')
async def get_chats(user : dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await user_auth_services.get_user_by_id(user['sub'])

        chats = await channels_collection.aggregate([
            # Step 1: Match messages where the user is either the sender or recipient
            {
                "$match": {
                    "$or": [
                        { "partner_id": user_data['_id'] },
                        { "user_id": user_data['_id'] }
                    ]
                }
            },
            # Step 2: Add a new field to identify who the partner (the other person) is
            {
                "$addFields": {
                    "partner_id": {
                        "$cond": [
                            { "$eq": ["$user_id", user_data['_id']] },  # If user is the sender
                            "$partner_id",                              # Get recipient's ID
                            "$user_id"                                  # Else get sender's ID
                        ]
                    }
                }
            },
            # Step 3: Group by the partner_id to get unique chat participants
            {
                "$group": {
                    "_id": "$partner_id",
                    "channel_id": { "$first": "$_id" }  # Save the original _id (channel id)
                }
            },
            # Step 4: Join with the users collection to get details of the partner
            {
                "$lookup": {
                    "from": "user",              # Assuming the users are stored in the "user" collection
                    "localField": "_id",          # Field from the current collection (partner_id)
                    "foreignField": "_id",        # Field from the "user" collection (_id of the partner)
                    "as": "partner_details",       # Field name for the joined partner details
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
                    "partner_details": 1,          # Include the partner details
                    'channel_id': 1,  # Include the channel_id
                }
            }
        ]).to_list()

        result_chats = [clean_get_chats_doc(chat) for chat in chats]

        response = json.loads(json_util.dumps({ "chats" : result_chats }))
        return response
    
    except HTTPException as http_exc:
        raise http_exc  
    except Exception as e:
        print("get_chats : ",e)


@router.get('/chat/get_chat_details/{channel_id}')
async def get_chat_details(channel_id: str, user: dict = Depends(user_auth_services.get_current_user)):
    try:
        try:
            channel_oid = ObjectId(channel_id)
            user_oid = ObjectId(user['sub'])
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid ID format")

        channel_record = await channels_collection.find_one({
            "_id": channel_oid,
            "$or": [
                {"user_id": user_oid},
                {"partner_id": user_oid}
            ]
        })

        if not channel_record:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        partner_details = {}
        partner_record = {}
        if(channel_record["user_id"] == user_oid):
            partner_record = await user_collection.find_one({ "_id": channel_record["partner_id"] })
        else:
            partner_record = await user_collection.find_one({ "_id": channel_record["user_id"] })

        partner_details = {
            "partner_id": partner_record['_id'],
            "channel_id": channel_record["_id"],
            "partner_details": {
                "name": partner_record['name'],
                "username": partner_record['username'],
                "profile_photo_url": partner_record['profile_photo_url']
            } 
        }

        return {
            "success": True,
            "chat": clean_object_ids(partner_details)
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("get_chat_details: ",e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete('/chat_delete/{sender_id}')
async def delete_chat(sender_id : str, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await user_auth_services.get_user_by_id(user['sub'])

        if(user_data["role"] == "guest"):
            raise HTTPException(status_code=403, detail="Guests cannot delete chats.")

        if not user_data:
            raise HTTPException(status_code=401, detail="Unauthorized access")
        
        await channels_collection.delete_one({
            "$or" : [
                {"user_id" : ObjectId(sender_id), "partner_id" : ObjectId(user_data["_id"])},
                {"user_id" : ObjectId(user_data["_id"]), "partner_id" : ObjectId(sender_id)}
            ]
        })

        return {
            "msg" : "Channel deleted successfully"
        }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("delete chat: ",e)
        raise  HTTPException(status_code=500, detail="Internal Server error")


@router.patch('/enable_e2ee/{channel_id}')
async def enable_e2ee(channel_id, data : dict, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await user_auth_services.get_user_by_id(user['sub'])
        await channels_collection.update_one({ "_id" : ObjectId(channel_id) }, { "$set" : {"is_e2ee" : data['isE2ee'] } })

        partner_id = await channels_collection.aggregate([
            # Step 1: Match messages where the user is either the sender or recipient
            {
                "$match": {
                    "_id" : ObjectId(channel_id)
                }
            },
            # Step 2: Add a new field to identify who the partner (the other person) is
            {
                "$addFields": {
                    "partner_id": {
                        "$cond": [
                            { "$eq": ["$user_id", user_data['_id']] },  # If user is the sender
                            "$partner_id",                              # Get recipient's ID
                            "$user_id"                                  # Else get sender's ID
                        ]
                    }
                }
            },
            # Step 3: Group by the partner_id to get unique chat participants
            {
                "$group": {
                    "_id": "$partner_id",          # Group by the ID of the partner
                }
            },
            # Step 5: Optionally project the fields you want (e.g., partner details and latest message)
            {
                "$project": {
                    "_id": 0,                         # Exclude the default _id
                    "partner_id": "$_id"
                }
            }
        ]).to_list()
        
        print("e2ee: ",data['isE2ee'])
        await manager.send_message_to_user(
        {
            "channel_id": channel_id,
            "sender_id": str(user_data['_id']),
            "recipient_id": str(partner_id[0]['partner_id']),
            "type": "e2ee_status",
            "sub_type": "enable" if data["isE2ee"] else "disable",
            "message": "",
            "timestamp": datetime.now().isoformat(),
        }, str(user_data['_id']), str(partner_id[0]['partner_id']))

        return {
            "msg" : "E2ee toggled successfully"
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(e.with_traceback)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get('/get_e2ee_status/{id}')
async def get_e2ee_status(id : str, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        channelExists = await channels_collection.find_one({
            "$or": [
                {"user_id": ObjectId(user['sub']), "partner_id": ObjectId(id) },
                {"user_id" : ObjectId(id), "partner_id" : ObjectId(user['sub']) }
            ]
        },{ "_id" : 1, "is_e2ee" : 1})

        if not channelExists:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        response = {"isE2ee" : channelExists.get('is_e2ee') }
        return response

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("get_e2ee_status : ",e)
        print(e.with_traceback)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get('/get_keys_data')
async def get_keys_data(user: dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await user_auth_services.get_user_by_id(user['sub'])

        keys = await channels_collection.find(
            {"user_id": user_data['_id'], "key": {"$exists": True}}
        ).to_list()

        res = []

        for key in keys:
            requests = await joining_requests_collection.aggregate([
                {
                    "$match": {
                        "channel_id": key['_id']
                    }
                },
                {
                    "$lookup": {
                        "from": "user",
                        "localField": "user_id",
                        "foreignField": "_id",
                        "as": "user_data"
                    }
                },
                {
                    "$unwind": "$user_data"
                },
                {
                    "$project": {
                        "_id": 1,
                        "user_id": 1,
                        "user_data.username": 1,
                        "user_data.profile_photo_url": 1
                    }
                }
            ]).to_list()

            print(requests)

            res.append({
                "key": clean_object_ids(key),
                "requests": clean_object_ids(requests)
            })

        return {"keys_data": clean_object_ids(res)}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("get_keys : ", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post('/edit_key_note')
async def edit_key_note(data: edit_key_note_model, user: dict = Depends(user_auth_services.get_current_user)):
    try:
        channelExists = await channels_collection.find_one({
            "_id": ObjectId(data.key_id),
            "user_id": ObjectId(user['sub'])
        })

        if not channelExists:
            raise HTTPException(status_code=404, detail="Channel not found")

        await channels_collection.update_one(
            {"_id": ObjectId(data.key_id)},
            {"$set": {"note": data.note}}
        )

        return { "success": True, "msg": "Note updated successfully"}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("edit_key_note : ", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete('/delete_key/{key_id}')
async def delete_key(key_id: str, user: dict = Depends(user_auth_services.get_current_user)):
    try:

        try:
            key_oid = ObjectId(key_id)
            user_oid = ObjectId(user['sub'])  # assuming sub holds user's _id as string
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid ID format")

        channelExists = await channels_collection.find_one({
            "_id": key_oid,
            "user_id": user_oid
        })

        if not channelExists:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        await joining_requests_collection.delete_many({
            "channel_id": key_oid
        })

        await public_keys_collection.delete_many({"channel_id": key_oid})
        await channels_collection.delete_one({"_id": key_oid})

        return { "success": True, "msg": "Key deleted successfully"}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("delete_key : ", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

   
@router.delete('/reject-request/{req_id}')
async def reject_request(req_id: str, user: dict = Depends(user_auth_services.get_current_user)):
    try:
        try:
            req_oid = ObjectId(req_id)
            user_oid = ObjectId(user['sub'])  # assuming sub holds user's _id as string
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid ID format")
        
        request_record = await joining_requests_collection.find_one({
            "_id": req_oid
        })

        if not request_record:
            raise HTTPException(status_code=404, detail="Request not found")
                
        channel_record = await channels_collection.find_one({
            "user_id": user_oid,
            "_id": request_record["channel_id"]
        })

        if not channel_record:
            raise HTTPException(status_code=404, detail="Channel not found or unauthorized")
        
        await joining_requests_collection.delete_one({"_id": request_record["_id"]})

        await public_keys_collection.delete_one({"chanel_id": channel_record["_id"], "user_id": request_record["user_id"]})

        return {
            "success": True,
            "message": "Request rejected successfully."
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("reject request: ",e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

   
@router.patch('/approve-request/{req_id}')
async def approve_request(req_id: str, user: dict = Depends(user_auth_services.get_current_user)):
    try:
        try:
            req_oid = ObjectId(req_id)
            user_oid = ObjectId(user['sub'])  # assuming sub holds user's _id as string
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid ID format")

        request_record = await joining_requests_collection.find_one({
            "_id": req_oid
        })

        if not request_record:
            raise HTTPException(status_code=404, detail="Request not found or unauthorized")
    
        channel_record = await channels_collection.find_one({"_id": request_record["channel_id"], "user_id": user_oid})

        if not channel_record:
            raise HTTPException(status_code=404, detail="Channel not found or unauthorized")
        
        await channels_collection.update_one(
            {"_id": channel_record["_id"]},
            {
                "$set": {
                    "partner_id": request_record["user_id"]
                },
                "$unset": {
                    "key": "",
                    "note": ""
                }
            }
        )

        joining_requests_collection.delete_many({"channel_id": channel_record["_id"]})

        res = {
            "success": True,
            "message": "Request approved successfully",
            "channel_id": channel_record["_id"],
            "partner_id": request_record["user_id"]
        }

        return clean_object_ids(res)
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("approve request: ", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")
    

@router.patch('/chat/refresh_connection/{channel_id}')
async def update_connection(channel_id: str, user: dict = Depends(user_auth_services.get_current_user)):
    try:

        try:
            user_oid = ObjectId(user["sub"])
            channel_oid = ObjectId(channel_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid ID format")

        user_data = await user_auth_services.get_user_by_id(user['sub'])

        channel_exists = await channels_collection.find_one({"_id" : channel_oid}, {"_id" : 1})

        if not channel_exists:
            raise HTTPException(status_code=404, detail="Channel not found")

        partner_id = await channels_collection.aggregate([
            # Step 1: Match messages where the user is either the sender or recipient
            {
                "$match": {
                    "_id" : channel_oid
                }
            },
            # Step 2: Add a new field to identify who the partner (the other person) is
            {
                "$addFields": {
                    "partner_id": {
                        "$cond": [
                            { "$eq": ["$user_id", user_data['_id']] },  # If user is the sender
                            "$partner_id",                              # Get recipient's ID
                            "$user_id"                                  # Else get sender's ID
                        ]
                    }
                }
            },
            # Step 3: Group by the partner_id to get unique chat participants
            {
                "$group": {
                    "_id": "$partner_id",          # Group by the ID of the partner
                }
            },
            # Step 5: Optionally project the fields you want (e.g., partner details and latest message)
            {
                "$project": {
                    "_id": 0,                         # Exclude the default _id
                    "partner_id": "$_id"
                }
            }
        ]).to_list()
        
        if not partner_id:
            raise HTTPException(status_code=404, detail="partner not found")

        await manager.send_message_to_user(
            {
                "event": "update_public_key",
                "sender_id": str(user["sub"]),
                "channel_id": channel_oid,
                "recipient_id": str(partner_id[0]['partner_id']) if partner_id else None,
            }, str(user['sub']), str(partner_id[0]['partner_id']) if partner_id else None
        )

        return {
            "success": True,
            "message" : "Request to refresh connection has been sent."
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("store_public_key : ", e.with_traceback())
        raise HTTPException(status_code=500, detail="Internal error")
