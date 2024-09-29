import secrets
import string
from ..db import get_collection

keys_collection = get_collection('keys')

async def genrate_key(length=16):

    characters = string.ascii_letters + string.digits
    while True:

        key = ''.join(secrets.choice(characters) for _ in range(length))

        exists = await keys_collection.find_one({ key : key})

        if not exists:
            return key
        
