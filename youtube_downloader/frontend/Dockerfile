# Frontend Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 5173

# Run dev server (use --host to expose outside container)
CMD ["npm", "run", "dev", "--", "--host"]
