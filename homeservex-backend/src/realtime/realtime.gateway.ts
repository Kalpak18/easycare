/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { jwtConstants } from '../auth/constants';

const ADMIN_ROOM = 'admin:room';

interface SocketUser {
  userId: string;
  role: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // ─── Verify JWT on connect; disconnect unauthenticated clients ─────────────
  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) { client.disconnect(); return; }
      const payload = jwt.verify(token, jwtConstants.secret) as any;
      (client as any).user = { userId: payload.sub, role: payload.role } as SocketUser;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  // ─── Provider joins their own room only ────────────────────────────────────
  @SubscribeMessage('join_provider')
  handleJoinProvider(
    @MessageBody() data: { providerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user as SocketUser | undefined;
    // Only let the authenticated provider join their own room
    if (!user || user.userId !== data.providerId) return;
    client.join(`provider:${data.providerId}`);
  }

  // ─── User joins their own room ─────────────────────────────────────────────
  @SubscribeMessage('join_user')
  handleJoinUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user as SocketUser | undefined;
    if (!user || user.userId !== data.userId) return;
    client.join(`user:${data.userId}`);
  }

  // ─── Admin joins admin room ────────────────────────────────────────────────
  @SubscribeMessage('join_admin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    const user = (client as any).user as SocketUser | undefined;
    if (!user || user.role !== 'ADMIN') return;
    client.join(ADMIN_ROOM);
  }

  // ─── Provider events ───────────────────────────────────────────────────────

  emitNewRequest(providerId: string, payload: any) {
    this.server.to(`provider:${providerId}`).emit('new_request', payload);
  }

  emitRequestTaken(providerId: string, requestId: string) {
    this.server
      .to(`provider:${providerId}`)
      .emit('request_taken', { requestId });
  }

  // ─── User events ───────────────────────────────────────────────────────────

  emitProviderAssigned(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('PROVIDER_ASSIGNED', payload);
  }

  emitJobStarted(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('JOB_STARTED', payload);
  }

  emitJobCompleted(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('JOB_COMPLETED', payload);
  }

  // ─── Admin broadcast events ────────────────────────────────────────────────

  emitAdminActiveJobs(count: number) {
    this.server.to(ADMIN_ROOM).emit('active_jobs', count);
  }

  emitAdminOnlineProviders(count: number) {
    this.server.to(ADMIN_ROOM).emit('provider_online', count);
  }

  emitAdminRequestCreated(payload: any) {
    this.server.to(ADMIN_ROOM).emit('request_created', payload);
  }
}
