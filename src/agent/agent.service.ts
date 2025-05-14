import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../common/services/openai.service';

@Injectable()
export class AgentService {
  constructor(private readonly openAiService: OpenAiService) {}

  async executeTask(message: string) {
    // TODO: Implémenter la logique de l'agent
    return {};
  }
}
