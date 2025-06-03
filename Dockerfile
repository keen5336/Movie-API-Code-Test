FROM node:20-slim
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
VOLUME ["/app/db"]
LABEL dev.containers.name="movie-api-dev"
RUN useradd -ms /bin/bash nodeuser
USER nodeuser
CMD ["npm", "run", "dev"]