import { io, Socket } from "socket.io-client";
import { ENV } from "../config/env";

let socket: Socket | null = null;
let _providerId: string | null = null;

export const connectSocket = (token: string) => {
  // Tear down any stale connection before creating a fresh authenticated one
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(ENV.API_BASE_URL, {
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    // Re-join provider room after reconnect so new_request events keep arriving
    if (_providerId) {
      socket!.emit("join_provider", { providerId: _providerId });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

export const joinProviderRoom = (providerId: string) => {
  _providerId = providerId;
  if (!socket) return;
  socket.emit("join_provider", { providerId });
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
