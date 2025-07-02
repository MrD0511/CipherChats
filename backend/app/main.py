from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import chat_router, auth_router, user_router, file_router
from .websocket import websocket_router
from .firebase import firebase_app
from .background_tasks import cleanup_expired_files
import asyncio

app = FastAPI()

origins = [
    "http://localhost:5173",  # Replace with your frontend URL
    "https://cipherchats.vercel.app",
    "https://cipherchats-mrd0511s-projects.vercel.app"
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
app.include_router(file_router)

@app.on_event("startup")
async def startup():
    print("Background task for cleaning up expired files has started.")
    asyncio.create_task(cleanup_expired_files())