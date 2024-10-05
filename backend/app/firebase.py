import firebase_admin
from firebase_admin import credentials, auth, storage
import pathlib

cred_path = pathlib.Path(__file__).parent / "kychat-6502c-firebase.json"

cred  = credentials.Certificate(str(cred_path))

firebase_app = firebase_admin.initialize_app(cred,  {
    'storageBucket' : "kychat-6502c.appspot.com"
})

bucket = storage.bucket()
