import { WsRoomRegistryService } from './ws-room-registry.service';

interface FakeClient {
  id: string;
}

function client(id: string): FakeClient {
  return { id };
}

describe('WsRoomRegistryService', () => {
  let registry: WsRoomRegistryService<FakeClient>;

  beforeEach(() => {
    registry = new WsRoomRegistryService<FakeClient>();
  });

  describe('join', () => {
    it('returns 1 for the first member of a room', () => {
      expect(registry.join('room-a', client('1'))).toBe(1);
    });

    it('returns an incrementing count as more clients join', () => {
      registry.join('room-a', client('1'));
      registry.join('room-a', client('2'));
      expect(registry.join('room-a', client('3'))).toBe(3);
    });

    it('keeps separate rooms independent', () => {
      registry.join('room-a', client('1'));
      registry.join('room-b', client('2'));
      expect(registry.participantCount('room-a')).toBe(1);
      expect(registry.participantCount('room-b')).toBe(1);
    });

    it('joining the same client twice does not double-count it', () => {
      const c = client('1');
      registry.join('room-a', c);
      expect(registry.join('room-a', c)).toBe(1);
    });
  });

  describe('leave', () => {
    it('decrements the participant count', () => {
      const a = client('1');
      const b = client('2');
      registry.join('room-a', a);
      registry.join('room-a', b);

      expect(registry.leave('room-a', a)).toBe(1);
    });

    it('returns 0 and forgets the room once the last member leaves', () => {
      const a = client('1');
      registry.join('room-a', a);

      expect(registry.leave('room-a', a)).toBe(0);
      expect(registry.participantCount('room-a')).toBe(0);
      expect(registry.broadcastTargets('room-a').size).toBe(0);
    });

    it('is a no-op for a room that was never joined', () => {
      expect(registry.leave('never-joined', client('1'))).toBe(0);
    });

    it('is a no-op for a client that is not a member of the room', () => {
      registry.join('room-a', client('1'));
      expect(registry.leave('room-a', client('2'))).toBe(1);
    });
  });

  describe('broadcastTargets', () => {
    it('returns every current member of the room', () => {
      const a = client('1');
      const b = client('2');
      registry.join('room-a', a);
      registry.join('room-a', b);

      const targets = registry.broadcastTargets('room-a');

      expect(targets.size).toBe(2);
      expect(targets.has(a)).toBe(true);
      expect(targets.has(b)).toBe(true);
    });

    it('returns an empty set for an unknown room', () => {
      expect(registry.broadcastTargets('missing').size).toBe(0);
    });
  });

  describe('participantCount', () => {
    it('returns 0 for a room that does not exist', () => {
      expect(registry.participantCount('missing')).toBe(0);
    });
  });
});
