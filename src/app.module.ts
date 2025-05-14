import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [AgentModule, CommonModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
