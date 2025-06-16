from pydantic import BaseModel

class store_public_key_model(BaseModel):
    channel_id : str
    public_key : str

class get_public_key_model(BaseModel):
    channel_id : str
    partner_id : str

class create_channel_model(BaseModel):
    note: str

class create_channel_response_model(BaseModel):
    channel_id: str
    key: str

class edit_key_note_model(BaseModel):
    key_id: str
    note: str
