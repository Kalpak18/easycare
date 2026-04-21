/* eslint-disable @typescript-eslint/no-explicit-any */
import { io } from "socket.io-client";

let socket: any;

export const connectSocket = () => {
  const token = localStorage.getItem("admin_token");

  socket = io(process.env.NEXT_PUBLIC_API_URL!, {
    auth: {
      token,
    },
  });

  return socket;
};

export const getSocket = () => socket;