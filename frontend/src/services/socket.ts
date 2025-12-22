import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Subscribe to deal updates
export const subscribeToDealUpdates = (callback: (data: any) => void): void => {
  if (!socket) return;

  socket.emit('subscribe:deals');
  socket.on('deal:created', callback);
  socket.on('deal:updated', callback);
  socket.on('deal:stageChanged', callback);
  socket.on('deal:deleted', callback);
};

export const unsubscribeFromDealUpdates = (): void => {
  if (!socket) return;

  socket.emit('unsubscribe:deals');
  socket.off('deal:created');
  socket.off('deal:updated');
  socket.off('deal:stageChanged');
  socket.off('deal:deleted');
};

// Subscribe to task updates
export const subscribeToTaskUpdates = (callback: (data: any) => void): void => {
  if (!socket) return;

  socket.emit('subscribe:tasks');
  socket.on('task:created', callback);
  socket.on('task:updated', callback);
  socket.on('task:deleted', callback);
};

export const unsubscribeFromTaskUpdates = (): void => {
  if (!socket) return;

  socket.emit('unsubscribe:tasks');
  socket.off('task:created');
  socket.off('task:updated');
  socket.off('task:deleted');
};

// Subscribe to notifications
export const subscribeToNotifications = (callback: (notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}) => void): void => {
  if (!socket) return;

  socket.on('notification', callback);
};

export const unsubscribeFromNotifications = (): void => {
  if (!socket) return;

  socket.off('notification');
};
