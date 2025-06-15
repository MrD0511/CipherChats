import secrets
import string
from ..db import get_collection
from datetime import datetime
import json

keys_collection = get_collection('keys')
queued_messages_collection = get_collection('queued_messages')


async def genrate_key(length=16):

    characters = string.ascii_letters + string.digits
    while True:

        key = ''.join(secrets.choice(characters) for _ in range(length))

        exists = await keys_collection.find_one({ key : key})

        if not exists:
            return key

async def queue_message(message):
    await queued_messages_collection.insert_one(message)

async def get_pending_messages(recipient_id):
    pending_messages = await queued_messages_collection.find({'recipient_id': recipient_id}).to_list()
    return pending_messages