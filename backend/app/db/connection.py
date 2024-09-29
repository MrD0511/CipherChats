from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# MongoDB client setup
client = AsyncIOMotorClient("mongodb+srv://Dhruv:CV5uZtdOjKScmtJi@cluster0.nm154p7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")


# Helper function to serialize ObjectId to string
def user_serializer(user) -> dict:
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "full_name": user.get("full_name", "")
    }



try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

db = client['chatapp']
users_collection = db['users']

def get_collection(collection):
    return db[collection]

db.list_collection_names()

