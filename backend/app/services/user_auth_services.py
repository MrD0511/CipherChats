from passlib.context import CryptContext
import os
from datetime import timedelta, datetime
from jose import JWTError, jwt
from dotenv import load_dotenv
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from ..db import get_collection
import secrets
import string

load_dotenv()

pwd_context = CryptContext(schemes=['bcrypt'], deprecated ='auto')
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

secret_key = os.getenv('SECRET_KEY')
algorithm = os.getenv('ALGORITHM')
user_collection = get_collection('user')

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password : str, hash_password : str):
    return pwd_context.verify(password, hash_password)

def create_access_token(data : dict, expires_delta : timedelta | None = None ):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(days=1)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, key=secret_key, algorithm=algorithm)

    return encoded_jwt

def verify_token(token: str):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except JWTError:
        raise credentials_exception
    
async def create_username(name : str):
    username = name.lower()
    username = username.replace(" ","")
    old_username = username

    characters = string.digits

    while True:

        exists = await user_collection.find_one({ "username" : username })

        if not exists:
            return username
        else:
            username = old_username
            key = ''.join(secrets.choice(characters) for _ in range(5))
            username = username+key

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    return payload

async def get_user_by_username(id : str):
    user_collection = get_collection('user')
    data = await user_collection.find_one({ "_id" : ObjectId(id) },{"_id", "email", "name", "username", "profile_photo_url"})
    return data
