import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  public getOpenAIInstance(): OpenAI {
    return this.openai;
  }
}
