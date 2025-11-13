# Use official lightweight Node.js image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
