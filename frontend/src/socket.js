import { io } from 'socket.io-client';

// Singleton socket instance — autoConnect: false so we connect manually after login
export const socket = io({
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
});

// Call this after login to attach the JWT and connect
export function connectSocket(token) {
  if (socket.connected) socket.disconnect();
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}
