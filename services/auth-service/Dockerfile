# Dockerfile for Auth Service
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Environment variables for the service
ENV PORT=5001

# Expose the port the service will run on
EXPOSE 5001

# Command to run the service
CMD ["node", "server.js"]
