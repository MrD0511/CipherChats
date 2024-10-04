from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime

class UserModel(BaseModel):
    email : EmailStr
    password : str
    username : str
    name : str
    # createdAt : datetime
    # updatedAt : datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class SignInModel(BaseModel):
    identifier: str  # This will accept either email or username
    password: str

