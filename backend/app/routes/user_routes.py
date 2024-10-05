from fastapi import APIRouter, UploadFile, File
from fastapi import Depends, HTTPException
from ..db import get_collection
from ..services import user_auth_services
from bson import ObjectId, json_util
from typing import Optional
import datetime
from ..services import chat_service, user_auth_services
from ..models import editProfileModel
from ..firebase import firebase_admin

router = APIRouter()

user_collection = get_collection('user')


@router.post('/user/profile/edit')
async def edit_profile(profile_data : editProfileModel, 
                       user : dict = Depends(user_auth_services.get_current_user)):
    try :
        user_data = await user_auth_services.get_user_by_username(user['sub'])
        profile_data_dict = profile_data.dict()
        username_exists = await user_collection.find_one({ "username" : profile_data_dict['username'], "_id" : { "$ne" : user_data['_id'] }})
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        await user_collection.update_one({ "_id" : user_data['_id']}, 
                                         {
                                            "$set": {
                                                "username" : profile_data_dict['username'],
                                                "name" : profile_data_dict['name']
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

