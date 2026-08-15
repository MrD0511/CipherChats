from fastapi import APIRouter, UploadFile, File, HTTPException
from ..db import get_collection
from datetime import datetime, timedelta
from ..azure_upload import upload_file

router = APIRouter()

files = get_collection("files")


@router.post("/file/upload")
async def upload_file_controller(file: UploadFile = File(...)):
    try:
        if not file:
            raise HTTPException(
                status_code=400,
                detail="No file uploaded"
            )

        file_data = await file.read()

        if not file_data:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded"
            )

        # file.content_type can theoretically be None
        content_type = file.content_type or "application/octet-stream"

        file_type = content_type.split("/")[0]

        if file_type not in [
            "image",
            "video",
            "audio",
            "application"
        ]:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type"
            )

        url = await upload_file(
            file.filename,
            file_data
        )

        files.insert_one({
            "file_name": file.filename,
            "file_type": file_type,
            "file_url": url,
            "file_size": file.size,
            "file_exp": datetime.utcnow() + timedelta(days=5)
        })

        return {
            "message": "File uploaded successfully",
            "file_url": url
        }

    except HTTPException:
        raise

    except Exception as e:
        print("File upload error:", e)

        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )