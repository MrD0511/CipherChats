from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

import asyncio

load_dotenv()
mongodb_url = os.getenv('MONGO_URL')

# Define placeholders
_client = None
_db = None

def _init_db_lazy():
    """Initializes the MongoDB client only when needed within the active event loop."""
    global _client, _db
    if _client is None:
        _client = AsyncIOMotorClient(mongodb_url)
        _db = _client['cipherchat']
        
        # FIX: Check if an event loop is active before scheduling background tasks
        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                loop.create_task(_ping_db(_client))
        except RuntimeError:
            # No running loop yet (compile/import time). 
            # We skip the ping background task safely; Motor handles lazily anyway.
            pass
            
    return _db


async def _ping_db(client):
    try:
        await client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(f"Database connection warning: {e}")

def get_collection(collection):
    # This automatically grabs the database instance bound to the running loop
    db_instance = _init_db_lazy()
    return db_instance[collection]

def get_client():
    """Safely retrieves the raw MongoDB client bound to the active loop."""
    _init_db_lazy()
    return _client