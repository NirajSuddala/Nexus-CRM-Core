import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketIOServer;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      socket.data.role = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.email}`);

    // Join user-specific room for notifications
    socket.join(`user:${socket.data.userId}`);

    // Handle deal updates subscription
    socket.on('subscribe:deals', () => {
      socket.join('deals');
    });

    socket.on('unsubscribe:deals', () => {
      socket.leave('deals');
    });

    // Handle task updates subscription
    socket.on('subscribe:tasks', () => {
      socket.join('tasks');
    });

    socket.on('unsubscribe:tasks', () => {
      socket.leave('tasks');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.email}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper functions for emitting events
export const emitToUser = (userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, data);
};

export const emitDealUpdate = (event: string, data: any): void => {
  io.to('deals').emit(event, data);
};

export const emitTaskUpdate = (event: string, data: any): void => {
  io.to('tasks').emit(event, data);
};

export const emitNotification = (userId: string, notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}): void => {
  io.to(`user:${userId}`).emit('notification', notification);
};
