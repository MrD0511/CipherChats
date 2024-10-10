from pydantic import BaseModel

class store_public_key_model(BaseModel):
    channel_id : str
    public_key : str

class get_public_key_model(BaseModel):
    channel_id : str
    partner_id : str