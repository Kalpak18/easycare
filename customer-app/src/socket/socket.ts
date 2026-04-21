import { io, Socket } from 'socket.io-client';
import ENV from '../config/env';
import { useAuthStore } from '../store/auth.store';
import { useRequestStore } from '../store/request.store';
import { ServiceRequest } from '../types';

let socket: Socket | null = null;

export const connectSocket = () => {
  const { accessToken, userId } = useAuthStore.getState();
  if (!accessToken || socket?.connected) return;

  socket = io(ENV.SOCKET_URL, {
    transports: ['websocket'],
    auth: { token: accessToken },
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
    // Join user's private room so the backend can push status updates
    if (userId) {
      socket!.emit('join_user', { userId });
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  // Real-time request status updates → update store
  socket.on('PROVIDER_ASSIGNED', (data: Partial<ServiceRequest>) => {
    if (data.id) useRequestStore.getState().updateRequest(data as ServiceRequest);
  });

  socket.on('JOB_STARTED', (data: Partial<ServiceRequest>) => {
    if (data.id) useRequestStore.getState().updateRequest(data as ServiceRequest);
  });

  socket.on('JOB_COMPLETED', (data: Partial<ServiceRequest>) => {
    if (data.id) useRequestStore.getState().updateRequest(data as ServiceRequest);
  });

  socket.on('request_updated', (data: ServiceRequest) => {
    useRequestStore.getState().updateRequest(data);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
