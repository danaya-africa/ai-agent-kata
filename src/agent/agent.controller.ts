import { Body, Controller, Post } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('execute')
  async executeTask(@Body() content: { message: string }) {
    const result = await this.agentService.executeTask(content.message);
    return result;
  }
}
