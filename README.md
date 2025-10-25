# Zenith Chat Backend

This is a simple Express/Node.js web server designed to interface with a React chat widget. It acts as a backend to facilitate communication between the chat widget and Gemini.

## Getting Started

1. **Install dependencies:**
    ```bash
    npm install
    ```

2. **Start the server:**
    ```bash
    npm start
    ```

3. The server will run on `http://localhost:3000` by default.
4. Make sure you have Docker installed. You'll need to install both postgres and pgvector.
   ```
   docker pull postgres:18-trixie
   docker pull pgvector/pgvector:pg18-trixie
   ```
5. Start Postgres instance
   ```
   docker run --name postgres-vector-store \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=zenith_chat \
     -p 5432:5432 \
     -d postgres:18-trixie
   ```
6. Connect to the database:
   ```bash
   docker exec -it postgres-vector-store psql -U postgres -d zenith_chat
   ```
7. **Connection String for your application:**
   ```
   postgresql://postgres:password@localhost:5432/zenith_chat
   ```

## Usage

Connect your React chat widget to the backend API endpoints to enable chat functionality.