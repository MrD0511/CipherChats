from ..db import get_collection
from datetime import datetime
from ..firebase_utils import delete_file_from_firebase
import asyncio

file_collection = get_collection("files")


async def cleanup_expired_files():
    while True:
        try:
            now = datetime.utcnow()
            expired_files = await file_collection.find({"file_exp": {"$lt": now}}).to_list(length=100)

            for file in expired_files:
                file_url = file.get("file_url")  # or storage_path
                if file_url:
                    delete_file_from_firebase(file_url)
                    await file_collection.delete_one({"_id": file["_id"]})
                    print(f"Deleted expired file: {file_url}")

        except Exception as e:
            print("Error during cleanup:", e)

        await asyncio.sleep(3600)  # Wait 1 hour before next check