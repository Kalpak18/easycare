/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { connectSocket } from "../../sockets/socketClient";
import { useSocketStore } from "../../store/socketStore";
import { useQueryClient } from "@tanstack/react-query"

export default function SocketListener() {
  const qc = useQueryClient();
  const setActiveJobs = useSocketStore((s) => s.setActiveJobs);
  const setOnlineProviders = useSocketStore((s) => s.setOnlineProviders);
  const addRequest = useSocketStore((s) => s.addRequest);

  useEffect(() => {
    const socket = connectSocket();

    socket.on("provider_online", (count: number) => {
      setOnlineProviders(count);
    });

    socket.on("active_jobs", (count: number) => {
      setActiveJobs(count);
      qc.invalidateQueries({ queryKey: ["requests"] });
    });

    socket.on("request_created", (request: any) => {
      addRequest(request);
      qc.invalidateQueries({ queryKey: ["requests"] });
    });

    return () => {
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
