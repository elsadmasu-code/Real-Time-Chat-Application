import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initializeSocket } from './socket/socketManager.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

const PORT = process.env.PORT || 5000;

// Connect to Database, then start server (or just start server if no DB is provided yet)
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.warn("Starting server without DB connection due to error:", err.message);
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (NO DB)`);
    });
});
