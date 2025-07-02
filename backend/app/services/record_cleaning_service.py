from datetime import datetime
from bson import ObjectId

def clean_key_document(doc):
    return {
        **doc,
        "_id": str(doc["_id"]),
        "user_id": str(doc["user_id"]),
        "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else doc["created_at"]
    }

def clean_get_chats_doc(doc):
    return {
        **doc,
        "channel_id": str(doc["channel_id"]),
        "partner_id": str(doc["partner_id"]),
        "partner_details": {
            **doc["partner_details"],
            "_id": str(doc["partner_details"]["_id"])
        }
    }

def clean_object_ids(doc):
    """Recursively convert ObjectId to string in nested dicts/lists."""
    if isinstance(doc, dict):
        return {k: clean_object_ids(str(v) if isinstance(v, ObjectId) else v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [clean_object_ids(item) for item in doc]
    return doc