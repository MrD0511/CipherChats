from pydantic import BaseModel, EmailStr


class UserModel(BaseModel):
    email : EmailStr
    password : str
    username : str
    name : str

class Token(BaseModel):
    access_token: str
    token_type: str

class SignInModel(BaseModel):
    identifier: str  # This will accept either email or username
    password: str

class GoogleAuthModel(BaseModel):
    id_token : str