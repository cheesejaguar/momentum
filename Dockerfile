FROM node:22-alpine

WORKDIR /app

# Install nodemon globally for auto-restart
RUN npm install -g nodemon

# Install dependencies first for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server with auto-restart on file changes
CMD ["nodemon", "--watch", "src", "--watch", "vite.config.ts", "--watch", "index.html", "--ext", "ts,tsx,js,jsx,json,css,html", "--exec", "npm run dev"]
