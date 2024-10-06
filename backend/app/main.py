from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import chat_router, auth_router, user_router
from .websocket import websocket_router
from .firebase import firebase_app

app = FastAPI()

origins = [
    "http://localhost:3000",  # Replace with your frontend URL
    "https://secrete-chat.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Or specify the methods you want to allow
    allow_headers=["*"],  # Or specify the headers you want to allow
)

app.include_router(chat_router)
app.include_router(websocket_router)
app.include_router(auth_router)
app.include_router(user_router)
