FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json (and package-lock.json if it exists) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Nginx file
COPY nginx.conf ./

# Copy application files
COPY . .

# Build the React app for production
RUN npm run build

# Use Nginx as the production server
FROM nginx:alpine

# Copy the built React app to Nginx's web server directory
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80


# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
