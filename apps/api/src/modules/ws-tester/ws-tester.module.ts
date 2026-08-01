import { Module } from '@nestjs/common';
import { WsTesterGateway } from './ws-tester.gateway';
import { WsRoomRegistryService } from './ws-room-registry.service';

@Module({
  providers: [WsTesterGateway, WsRoomRegistryService],
})
export class WsTesterModule {}
