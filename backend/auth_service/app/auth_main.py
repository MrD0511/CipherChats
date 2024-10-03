from fastapi import FastAPI, HTTPException
from .models import UserModel, Token, SignInModel
from .services import auth
from fastapi.middleware.cors import CORSMiddleware
from .database import get_collection

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


@app.post('/signup', response_model=Token)
async def signup(user: UserModel):
    try:
        user_dict = user.dict()
        user_collection = get_collection('user')
        existing_user  = await user_collection.find_one({ 'email' : user_dict['email']})
        if existing_user:
            return HTTPException(status_code=400, detail="Email is already registered")
        
        hashed_password = auth.hash_password(user_dict['password'])
        user_dict['password_hash'] = hashed_password
        del user_dict['password']

        await user_collection.insert_one(user_dict)

        access_token = auth.create_access_token({ 'sub' : str(user_dict['_id'])})
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

        if not auth.verify_password(user.password, user_data['password_hash']):
            raise HTTPException(status_code=400, detail="invalid credentials")
        
        access_token = auth.create_access_token(data={"sub": str(user_data['_id'])})
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException as http_exc:
        raise http_exc  # Re-raise HTTP exceptions to maintain status code
    except Exception as e:
        print("signin : ", e)
        raise HTTPException(status_code=500, detail="Internal server error")  # Raise an HTTPException for consistency
