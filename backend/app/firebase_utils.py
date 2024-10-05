import uuid
from pathlib import Path
from firebase_admin import storage

async def upload_file_to_firebase(file, file_name : str, folder_name : str ) -> str:
    try:
        file_extension = Path(file_name).suffix
        unique_filename = f"{folder_name}/{uuid.uuid4()}{file_extension}"
        
        # Get Firebase storage bucket
        blob = storage.bucket().blob(unique_filename)

        # Upload the file to Firebase (upload_from_file expects a file object)
        blob.upload_from_file(file.file, content_type=file.content_type)

        # Make the file publicly accessible
        blob.make_public()

        # Return the public URL of the uploaded file
        return blob.public_url
    except Exception as e:
        print("Error uploading file to Firebase:", e)
        raise Exception("Failed to upload file to Firebase")
    

def delete_file_from_firebase(file_url: str):
    try:
        # Extract the file name from the URL
        bucket = storage.bucket()

        base_url = "https://storage.googleapis.com/kychat-6502c.appspot.com/"
        file_path = file_url.replace(base_url, "")
        
        blob = bucket.blob(file_path)
        print(blob)
        if not blob:
            print("file not found")
            return
        # Delete the file from Firebase Storage
        blob.delete()

        print(f"File {file_path} deleted from Firebase Storage.")
    except Exception as e:
        print("Error deleting file from Firebase:", e)
        raise Exception("Failed to delete file from Firebase")

