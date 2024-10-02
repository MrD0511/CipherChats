# Use official Python runtime as a base image
FROM python:3.12.6

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file to the working directory and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Expose port 8000 for FastAPI app
EXPOSE 8000

# Command to run the FastAPI app
CMD ["fastapi", "dev", "app", "--host", "0.0.0.0", "--port", "8000"]
