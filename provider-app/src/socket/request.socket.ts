import { getSocket } from "./socket";

export const listenForNewRequests = (callback: (data: any) => void) => {
  const socket = getSocket();
  if (!socket) return;

  socket.off("new_request");

  socket.on("new_request", (data) => {
    console.log("Incoming job request:", data);
    callback(data);
  });
};

