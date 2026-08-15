import os
import mimetypes

from dotenv import load_dotenv
from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob import ContentSettings
from azure.core.exceptions import ResourceExistsError

load_dotenv()

connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
container_name = os.getenv("AZURE_STORAGE_CONTAINER_NAME")

blob_service_client = BlobServiceClient.from_connection_string(
    connection_string
)

container_client = blob_service_client.get_container_client(
    container_name
)


async def init_container():
    try:
        await container_client.create_container()
    except ResourceExistsError:
        pass


async def upload_file(filename: str, buffer: bytes):

    blob_client = container_client.get_blob_client(filename)

    # Detect MIME type from extension
    content_type, _ = mimetypes.guess_type(filename)

    if content_type is None:
        content_type = "application/octet-stream"

    await blob_client.upload_blob(
        buffer,
        overwrite=True,
        content_settings=ContentSettings(
            content_type=content_type
        ),
    )

    print(f"File uploaded successfully: {blob_client.url}")

    return blob_client.url


__all__ = [
    "init_container",
    "upload_file",
]