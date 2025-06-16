from datetime import datetime

def clean_key_document(doc):
    return {
        **doc,
        "_id": str(doc["_id"]),
        "user_id": str(doc["user_id"]),
        "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else doc["created_at"]
    }