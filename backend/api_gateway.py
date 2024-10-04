from fastapi import FastAPI, HTTPException, Request
import httpx  # Used for making HTTP requests to microservices
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",  # Replace with your frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Or specify the methods you want to allow
    allow_headers=["*"],  # Or specify the headers you want to allow
)

# The addresses of the microservices
AUTH_SERVICE_URL = "http://127.0.0.1:8001"
CHAT_SERVICE_URL = "http://127.0.0.1:8002"

client = httpx.AsyncClient()

async def proxy_request(service_url: str, method: str, path: str, request: Request):    
    headers = request.headers
    print(method)
    try:
        if method == "GET":
            response = await client.get(f"{service_url}{path}", headers=headers, params=request.query_params)
        elif method == "POST":
            response = await client.post(f"{service_url}{path}", headers=headers, json=await request.json())
        elif method == "PUT":
            response = await client.put(f"{service_url}{path}", headers=headers, json=await request.json())
        elif method == "DELETE":
            response = await client.delete(f"{service_url}{path}", headers=headers)
        else:
            raise HTTPException(status_code=405, detail="Method Not Allowed")

        return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail="Service Unavailable") from e
        

# API Gateway route for Auth service
@app.api_route("/auth/{path:path}")
async def auth_gateway(path: str, request: Request):
    print("auth")
    return await proxy_request(AUTH_SERVICE_URL, request.method, f"/auth/{path}", request)


# API Gateway route for Chat service
@app.api_route("/{path:path}")
async def chat_gateway(path: str, request: Request):
    return await proxy_request(CHAT_SERVICE_URL, request.method, f"/{path}", request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
