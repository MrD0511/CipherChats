from fastapi import APIRouter
from fastapi import HTTPException
from ..db import get_collection
from ..services import user_auth_services
from ..services import user_auth_services
from ..models import Token, UserModel, SignInModel

router = APIRouter()

user_collection = get_collection('user')
messages_collection = get_collection('messages')

@router.post('/auth/signup', response_model=Token)
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
        
@router.post('/auth/signin', response_model=Token)
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

@router.get('/auth/check_username/{username}')
async def check_username(username : str):
    try:
        username_exists = await user_collection.find_one({ "username" : username}, {"_id" : 1})
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already exists")
        return { "msg" :"Username available" }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server Error")