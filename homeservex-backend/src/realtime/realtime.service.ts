import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  constructor(private gateway: RealtimeGateway) {}

  // ─── Provider ──────────────────────────────────────────────────────────────
  emitNewRequest(providerId: string, payload: any) {
    this.gateway.emitNewRequest(providerId, payload);
  }

  emitRequestTaken(providerId: string, requestId: string) {
    this.gateway.emitRequestTaken(providerId, requestId);
  }

  // ─── User ──────────────────────────────────────────────────────────────────
  emitProviderAssigned(userId: string, payload: any) {
    this.gateway.emitProviderAssigned(userId, payload);
  }

  emitJobStarted(userId: string, payload: any) {
    this.gateway.emitJobStarted(userId, payload);
  }

  emitJobCompleted(userId: string, payload: any) {
    this.gateway.emitJobCompleted(userId, payload);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  emitAdminActiveJobs(count: number) {
    this.gateway.emitAdminActiveJobs(count);
  }

  emitAdminOnlineProviders(count: number) {
    this.gateway.emitAdminOnlineProviders(count);
  }

  emitAdminRequestCreated(payload: any) {
    this.gateway.emitAdminRequestCreated(payload);
  }
}
