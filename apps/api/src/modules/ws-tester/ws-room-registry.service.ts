import { Injectable } from '@nestjs/common';

@Injectable()
export class WsRoomRegistryService<T extends object = object> {
  private readonly rooms = new Map<string, Set<T>>();

  join(room: string, client: T): number {
    let members = this.rooms.get(room);
    if (!members) {
      members = new Set();
      this.rooms.set(room, members);
    }
    members.add(client);
    return members.size;
  }

  // Deletes the room entry once it's empty so ad-hoc room ids don't leak
  // memory for the lifetime of the process.
  leave(room: string, client: T): number {
    const members = this.rooms.get(room);
    if (!members) return 0;
    members.delete(client);
    if (members.size === 0) {
      this.rooms.delete(room);
      return 0;
    }
    return members.size;
  }

  broadcastTargets(room: string): Set<T> {
    return this.rooms.get(room) ?? new Set();
  }

  participantCount(room: string): number {
    return this.rooms.get(room)?.size ?? 0;
  }
}
