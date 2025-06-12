from fastapi import APIRouter, UploadFile, File, HTTPException
from ..firebase_utils import upload_file_to_firebase, delete_file_from_firebase, upload_file_to_firebase_downloadable
from typing import List
from ..db import get_collection
from datetime import datetime, timedelta

router = APIRouter()

files = get_collection('files')

@router.post('/file/upload')
async def upload_file(file: UploadFile = File(...)):
    try:
        if not file:
            return {"message": "No file uploaded"}

        file_type = file.content_type.split('/')[0]
        if file_type not in ['image', 'video', 'audio', 'application']:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        urls = await upload_file_to_firebase_downloadable(file, file.filename, "file")

        files.insert_one({
            "file_name": file.filename,
            "file_type": file_type,
            "file_url": urls[0],
            "file_size": file.size,
            "file_exp": datetime.utcnow() + timedelta(days=5)  # Example expiration of 5 days
        })

        return {"message": "File uploaded successfully", "file_url": urls[1]}

    except Exception as e:
        print("File upload error:", e)
        return {"message": "Error uploading file", "error": str(e)}
      
      