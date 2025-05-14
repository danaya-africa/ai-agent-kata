import { Module } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';

@Module({
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class CommonModule {}
