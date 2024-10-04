from fastapi import UploadFile, File
from typing import Optional
from pydantic import BaseModel

class editProfileModel(BaseModel):
    username : str
    name : str
    # profile_photo : Optional[UploadFile] = None