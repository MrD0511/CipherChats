from datetime import datetime

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