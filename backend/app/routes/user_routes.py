from fastapi import APIRouter, UploadFile, File, Form
from fastapi import Depends, HTTPException
from ..db import get_collection
from ..services import user_auth_services
from bson import ObjectId, json_util
from typing import Optional
import datetime
from ..services import chat_service, user_auth_services
from ..models import editProfileModel
from ..firebase import firebase_admin, bucket
from firebase_admin import storage
import uuid
from pathlib import Path
import os

router = APIRouter()

user_collection = get_collection('user')



@router.post('/user/profile/edit')
async def edit_profile(username : str = Form(...),
                       name : str = Form(...),
                       profile_photo : UploadFile = File(...),
                       user : dict = Depends(user_auth_services.get_current_user)):
    try :
        user_data = await user_auth_services.get_user_by_username(user['sub'])
        
        username_exists = await user_collection.find_one({ "username" : username, "_id" : { "$ne" : user_data['_id'] }})
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already exists")

        if profile_photo:
            print(profile_photo.file)
            file_extension = Path(str(profile_photo.filename)).suffix
            firebase_filename = f"profile_photo/{uuid.uuid4()}{str(file_extension)}"

            profile_photo = await profile_photo.read()
            blob = bucket.blob(firebase_filename)
            blob.upload_from_filename(profile_photo)
            blob.make_public()
            
            profile_photo_url = blob.public_url
        else:
            profile_photo_url = user_data.get('profile_photo') 

        await user_collection.update_one({ "_id" : user_data['_id']}, 
                                         {
                                            "$set": {
                                                "username" : username,
                                                "name" : name,
                                                "profile_photo_url" : profile_photo_url
                                             }
                                         })
    
        return { "msg" : "profile updated successfully" }
    except HTTPException as http_exc:
        raise http_exc  
    except Exception as e:
        print("edit_profile : ",e)

@router.get('/user/check_username/{username}')
async def check_username(username : str, user : Optional[dict] = Depends(user_auth_services.get_current_user)):
    try:
        username_exists = await user_collection.find_one({ "username" : username}, {"_id" : 1})
        if username_exists and str(username_exists['_id']) is not user['sub']:
            raise HTTPException(status_code=400, detail="Username already exists")
        return { "msg" :"Username available" }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server Error")

