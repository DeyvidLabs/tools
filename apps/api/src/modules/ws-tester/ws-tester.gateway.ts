import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'http';
import { WebSocket, type RawData } from 'ws';
import { WsRoomRegistryService } from './ws-room-registry.service';

interface SystemEvent {
  __type: 'system';
  event: 'joined' | 'left';
  room: string | null;
  participants: number;
}

function extractRoom(url: string | undefined): string | null {
  if (!url) return null;
  const room = new URL(url, 'http://localhost').searchParams.get('room');
  return room?.trim() || null;
}

function systemEvent(
  event: SystemEvent['event'],
  room: string | null,
  participants: number,
): string {
  const payload: SystemEvent = { __type: 'system', event, room, participants };
  return JSON.stringify(payload);
}

// Path lines up with nginx's existing `location /api/` block (upgrade
// headers added there) — setGlobalPrefix('api', ...) only covers Express
// HTTP routing, not this adapter's own upgrade-path matching, so the
// prefix has to be spelled out here explicitly.
@Injectable()
@WebSocketGateway({ path: '/api/ws-tester' })
export class WsTesterGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WsTesterGateway.name);
  private readonly clientRooms = new WeakMap<WebSocket, string | null>();

  constructor(private readonly registry: WsRoomRegistryService<WebSocket>) {}

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    const room = extractRoom(request.url);
    this.clientRooms.set(client, room);

    if (room) {
      const participants = this.registry.join(room, client);
      this.broadcast(room, systemEvent('joined', room, participants));
    } else {
      this.send(client, systemEvent('joined', null, 1));
    }

    client.on('message', (data: RawData, isBinary: boolean) => {
      this.onMessage(client, data, isBinary);
    });
  }

  handleDisconnect(client: WebSocket): void {
    const room = this.clientRooms.get(client);
    if (!room) return;
    const participants = this.registry.leave(room, client);
    this.broadcast(room, systemEvent('left', room, participants));
  }

  // Relayed/echoed verbatim — this tool exists to show exactly what a
  // client sent, not to reinterpret or validate the payload.
  private onMessage(client: WebSocket, data: RawData, isBinary: boolean): void {
    const room = this.clientRooms.get(client);
    if (room) {
      this.broadcast(room, data, isBinary, client);
    } else {
      this.send(client, data, isBinary);
    }
  }

  private send(
    client: WebSocket,
    data: RawData | string,
    isBinary = false,
  ): void {
    if (client.readyState !== WebSocket.OPEN) return;
    try {
      client.send(data, { binary: isBinary });
    } catch (error) {
      this.logger.warn(
        `Failed to send to a ws-tester client: ${String(error)}`,
      );
    }
  }

  private broadcast(
    room: string,
    data: RawData | string,
    isBinary = false,
    exclude?: WebSocket,
  ): void {
    for (const client of this.registry.broadcastTargets(room)) {
      if (client === exclude) continue;
      this.send(client, data, isBinary);
    }
  }
}
