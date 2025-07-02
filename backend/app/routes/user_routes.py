from fastapi import APIRouter, UploadFile, File, Form
from fastapi import Depends, HTTPException
from ..db import get_collection
from ..services import user_auth_services
from ..services import  user_auth_services
from ..firebase_utils import upload_file_to_firebase, delete_file_from_firebase
from bson import ObjectId

router = APIRouter()
user_collection = get_collection('user')


@router.post('/user/profile/edit')
async def edit_profile(username: str = Form(...),
                       name: str = Form(...),
                       profile_photo: UploadFile = File(None),  # Make profile photo optional
                       user: dict = Depends(user_auth_services.get_current_user)):
    try:
        # Get the user's data
        user_data = await user_auth_services.get_user_by_id(user['sub'])

        if(user_data["role"] == "guest"):
            raise HTTPException(status_code=403, detail="Guests cannot edit user profiles")

        # Check if the username already exists for another user
        username_exists = await user_collection.find_one({ "username": username, "_id": { "$ne": user_data['_id'] }})
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        profile_photo_url = user_data.get('profile_photo_url')  # Keep the existing profile photo if none is uploaded

        # Handle profile photo upload
        if profile_photo:
            if profile_photo_url:
                delete_file_from_firebase(user_data.get('profile_photo_url'))
            profile_photo_url = await upload_file_to_firebase(profile_photo, profile_photo.filename, "profile photo")
        else:
            profile_photo_url = user_data.get('profile_photo_url')
       
        await user_collection.update_one(
            { "_id": user_data['_id'] },  # Find the user by ID
            {
                "$set": {
                    "username": username,
                    "name": name,
                    "profile_photo_url": profile_photo_url  # Update profile photo URL
                }
            }
        )

        return {"msg": "Profile updated successfully", "profile_photo_url": profile_photo_url, "username": username, "name": name }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("edit_profile error:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get('/user/check_username/{username}')
async def check_username(username : str, user : dict = Depends(user_auth_services.get_current_user)):
    try:
        username_exists = await user_collection.find_one({ "username" : username , "_id" : {"$ne" : ObjectId(user['sub'])}}, {"_id" : 1})
        if username_exists and str(username_exists['_id']) is not user['sub']:
            raise HTTPException(status_code=400, detail="Username already exists")
        return { "msg" :"Username available" }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("check user username: ", e)
        raise HTTPException(status_code=500, detail="Internal server Error")


@router.get('/user/profile')
async def get_profile(user : dict = Depends(user_auth_services.get_current_user)):
    try:
        user_data = await user_auth_services.get_user_by_id(user['sub'])
        
        if not user_data:
            raise HTTPException(status_code=400, detail="User not found")
        
        return { 
            "_id" : str(user_data['_id']),
            "username" : user_data['username'],
            "name" : user_data["name"],
            "profile_url" : user_data.get("profile_photo_url")
        }
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print("get_profile", e)
        raise HTTPException(status_code=500, detail="Internal server error.")