from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()
mongodb_url = os.getenv('MONGO_URL')
# MongoDB client setup
client = AsyncIOMotorClient(mongodb_url)

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

db = client['chatapp']

def get_collection(collection):
    return db[collection]

