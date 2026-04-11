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
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

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
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Socket.IO
setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
