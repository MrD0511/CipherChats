import uuid
from pathlib import Path
from firebase_admin import storage
from urllib.parse import unquote

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

        if file_url.find("https://storage.googleapis.com/kychat-6502c.appspot.com/") == -1:
            print("file not found")
            return

        base_url = "https://storage.googleapis.com/kychat-6502c.appspot.com/"
        file_path = file_url.replace(base_url, "")
        
        decoded_file_path = unquote(file_path)  # Decode the URL-encoded file path
        
        # Reference the blob (file) in Firebase Storage
        blob = bucket.blob(decoded_file_path)
        
        if not blob:
            print("file not found")
            return
        # Delete the file from Firebase Storage
        blob.delete()

        print(f"File {file_path} deleted from Firebase Storage.")
    except Exception as e:
        print("Error deleting file from Firebase:", e)
        raise Exception("Failed to delete file from Firebase")

