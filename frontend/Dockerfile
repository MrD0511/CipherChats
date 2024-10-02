# Use official Node.js image as a base
FROM node:20.11.1

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the app's source code into the container
COPY . .

# Build the React app for production
RUN npm run build

# Expose port 3000 to serve the app
EXPOSE 3000

# Command to start the app
CMD ["npm", "start"]
