import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../common/services/openai.service';
import {
  Center,
  getAvailableDocumentTypes,
  getCentersByDocumentAndCity,
  getEstimationByDocument,
  getProcedureByDocument,
  Procedure,
} from '../mocks/functions';
import OpenAI from 'openai';

type Model = 'gpt-4' | 'gpt-4.1-mini';

const model: Model = 'gpt-4.1-mini';

@Injectable()
export class AgentService {
  constructor(private readonly openAiService: OpenAiService) {}

  async executeTask(message: string) {
    // TODO: Implémenter la logique de l'agent
    const systemPrompt =
      'Tu es un assistant qui aide à faire des démarches en Côte d\'Ivoire.';
    console.time('Extract city Duration: ');
    const city = (await this.extractCityFromMessage(message)) || 'Bouaké';
    console.timeEnd('Extract city Duration: ');

    const initialChat = await this.openAiService
      .getOpenAIInstance()
      .chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        tool_choice: 'auto',
        tools: this.getFunctionDefinitions().map((fn) => ({
          type: 'function',
          function: fn,
        })),
      });

    const response = initialChat.choices[0].message;
    console.log('response', response);
    if (!response.tool_calls?.length) {
      return { message: response.content };
    }
    const toolCall = response.tool_calls[0];
    const { name, arguments: argsJson } = toolCall.function;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const args = JSON.parse(argsJson || '{}');

    let procedure: Procedure | undefined;
    let centers: Center[] | undefined;
    let estimation = '';
    let summary = '';
    let internalComment = '';
    let internalDetails: { name: string; args: any; result: string }[] = [];
    if (name === 'getProcedure') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      procedure = getProcedureByDocument(args.documentType);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      centers = getCentersByDocumentAndCity(args.documentType, city);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      estimation = JSON.stringify(getEstimationByDocument(args.documentType));
      summary = await this.summarizeProcedure(JSON.stringify(procedure));

      const internalResult = await this.callInternalAgent(
        `Procédure : ${JSON.stringify(procedure)}\nCentres : ${JSON.stringify(centers)}\nEstimation : ${estimation}`,
      );
      internalComment = internalResult.comment;
      internalDetails = internalResult.details;
    }
    const toolCallMessage = response; // celui qui contient tool_calls
    const toolCalls = response.tool_calls;
    const toolResponses: OpenAI.ChatCompletionMessageParam[] =
      await Promise.all(
        toolCalls.map(async (toolCall) => {
          const name = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || '{}');

          let result = '';
          if (name === 'getProcedure') {
            result = JSON.stringify(getProcedureByDocument(args.documentType));
          } else if (name === 'getCenters') {
            result = JSON.stringify(
              getCentersByDocumentAndCity(args.documentType, city),
            );
          } else if (name === 'getEstimation') {
            result = JSON.stringify(getEstimationByDocument(args.documentType));
          } else if (name === 'summarizeProcedure') {
            result = await this.summarizeProcedure(args.procedureText);
          }

          return {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          };
        }),
      );

    const finalChat = await this.openAiService
      .getOpenAIInstance()
      .chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
          response, // assistant avec tool_calls
          ...toolResponses, // tous les messages tool avec tool_call_id
        ],
      });

    return {
      functionsCalled: [
        'getProcedure',
        'getCenters',
        'getEstimation',
        'summarizeProcedure',
        'callInternalAgent',
      ],
      result: {
        procedure,
        centers,
        estimation,
        summary,
        internalComment,
        internalDetails,
      },
      finalResponse: finalChat.choices[0].message.content,
    };
  }

  private async summarizeProcedure(procedureText: string): Promise<string> {
    const result = await this.openAiService
      .getOpenAIInstance()
      .chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Tu dois résumer cette procédure administrative en langage simple et clair pour un citoyen.',
          },
          {
            role: 'user',
            content: procedureText,
          },
        ],
      });

    return result.choices[0].message.content || '';
  }

  private getFunctionDefinitions() {
    return [
      {
        name: 'getProcedure',
        description:
          'Retourne les étapes pour obtenir un document administratif',
        parameters: {
          type: 'object',
          properties: {
            documentType: {
              type: 'string',
              enum: getAvailableDocumentTypes(),
              description:
                'Le type de document (ex: cni, casier, certificat_nationalite)',
            },
          },
          required: ['documentType'],
        },
      },
      {
        name: 'getCenters',
        description:
          'Retourne une liste de centres disponibles pour une ville et un document donné',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            documentType: { type: 'string' },
          },
          required: ['city', 'documentType'],
        },
      },
      {
        name: 'getEstimation',
        description:
          'Donne une estimation du délai et du coût pour un document administratif',
        parameters: {
          type: 'object',
          properties: {
            documentType: { type: 'string' },
          },
          required: ['documentType'],
        },
      },
      {
        name: 'summarizeProcedure',
        description: 'Fait un résumé simple d\'une procédure administrative',
        parameters: {
          type: 'object',
          properties: {
            procedureText: { type: 'string' },
          },
          required: ['procedureText'],
        },
      },
    ];
  }

  private async extractCityFromMessage(
    message: string,
  ): Promise<string | null> {
    const result = await this.openAiService
      .getOpenAIInstance()
      .chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Ta tâche est d’extraire la ville mentionnée dans ce message. ' +
              'Réponds uniquement par le nom de la ville. ' +
              'Si aucune ville n’est trouvée, réponds « aucune ».',
          },
          { role: 'user', content: message },
        ],
      });

    const answer = result.choices[0].message.content?.trim().toLowerCase();
    return !answer || answer.includes('aucune') ? null : answer;
  }

  private async callInternalAgent(context: string): Promise<{
    comment: string;
    details: { name: string; args: any; result: string }[];
  }> {
    const response = await this.openAiService
      .getOpenAIInstance()
      .chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Tu es un agent secondaire qui analyse les démarches administratives.',
          },
          { role: 'user', content: `Voici le contexte : ${context}` },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detectUrgency',
              description: 'Détermine si la procédure semble urgente',
              parameters: {
                type: 'object',
                properties: {
                  procedureText: { type: 'string' },
                },
                required: ['procedureText'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'suggestReminder',
              description:
                'Suggère une date de rappel pour ne pas oublier une démarche',
              parameters: {
                type: 'object',
                properties: {
                  documentType: { type: 'string' },
                },
                required: ['documentType'],
              },
            },
          },
        ],
        tool_choice: 'auto',
      });

    const reply = response.choices[0].message;
    const details = [];

    if (reply.tool_calls?.length) {
      const call = reply.tool_calls[0];
      const { name, arguments: argsJson } = call.function;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const args = JSON.parse(argsJson || '{}');

      if (name === 'detectUrgency') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const result = `Analyse d'urgence : cette procédure ${args.procedureText.includes('urgence') ? 'est urgente' : 'n"est pas urgente'}.`;
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details.push({ name, args, result });
        return { comment: result, details };
      }

      if (name === 'suggestReminder') {
        const result = `Ajoutez un rappel pour refaire votre demande de ${args.documentType} dans 6 mois.`;
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details.push({ name, args, result });
        return { comment: result, details };
      }
    }

    return { comment: reply.content || '', details };
  }
}
