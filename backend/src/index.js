import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth.js';
import { setupSocketHandlers } from './socket/handlers.js';
dotenv.config();
const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    // You can add more origins here, e.g., your staging URL
];
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});
app.use(cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} (Path: ${req.path})`);
    next();
});
// Routes
import authRoutes from './routes/profile.js';
import roomsRoutes from './routes/rooms.js';
import messagesRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';
app.use('/profile', authRoutes);
app.use('/rooms', roomsRoutes);
app.use('/messages', messagesRoutes);
app.use('/upload', uploadRoutes);
import dmRoutes from './routes/dm.js';
app.use('/dm', dmRoutes);
import reactionsRoutes from './routes/reactions.js';
app.use('/reactions', reactionsRoutes);
// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});
// Socket.IO
setupSocketHandlers(io);
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map