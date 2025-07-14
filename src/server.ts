import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ObsidianHandler } from './obsidian-handler.js';
import { ObsidianConfig } from './types.js';

class ObsidianMCPServer {
  private server: Server;
  private obsidianHandler: ObsidianHandler;

  constructor() {
    this.server = new Server(
      {
        name: 'obsidian-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 環境変数からObsidian設定を取得
    const config: ObsidianConfig = {
      vaultPath: process.env.OBSIDIAN_VAULT_PATH || './vault',
      templateDir: process.env.OBSIDIAN_TEMPLATE_DIR || 'TEMPLATE',
    };

    this.obsidianHandler = new ObsidianHandler(config);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_note_from_template',
          description: 'テンプレートを使用してObsidianノートを作成します',
          inputSchema: {
            type: 'object',
            properties: {
              templateName: {
                type: 'string',
                description: 'TEMPLATEフォルダ内のテンプレート名（.md拡張子なし）',
              },
              variables: {
                type: 'object',
                description: 'テンプレート内の変数を置換するためのオブジェクト',
              },
              outputPath: {
                type: 'string',
                description: 'ノートの保存先パス（vault相対パス）',
              },
              overwrite: {
                type: 'boolean',
                description: '既存ファイルを上書きするかどうか',
                default: false,
              },
            },
            required: ['templateName', 'variables', 'outputPath'],
          },
        },
        {
          name: 'list_templates',
          description: 'TEMPLATEフォルダ内の利用可能なテンプレート一覧を取得します',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'read_note',
          description: 'Obsidianノートの内容を読み込みます',
          inputSchema: {
            type: 'object',
            properties: {
              notePath: {
                type: 'string',
                description: 'ノートのパス（vault相対パス）',
              },
            },
            required: ['notePath'],
          },
        },
        {
          name: 'update_note',
          description: 'Obsidianノートの内容を更新します',
          inputSchema: {
            type: 'object',
            properties: {
              notePath: {
                type: 'string',
                description: 'ノートのパス（vault相対パス）',
              },
              content: {
                type: 'string',
                description: '新しいノートの内容',
              },
            },
            required: ['notePath', 'content'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        if (!args) {
          throw new McpError(ErrorCode.InvalidParams, 'Arguments are required');
        }

        switch (name) {
          case 'create_note_from_template':
            const result = await this.obsidianHandler.createNoteFromTemplate({
              templateName: args.templateName as string,
              variables: (args.variables as Record<string, any>) || {},
              outputPath: args.outputPath as string,
              overwrite: (args.overwrite as boolean) || false,
            });
            return {
              content: [{ type: 'text', text: result }],
            };

          case 'list_templates':
            const templates = await this.obsidianHandler.listTemplates();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(templates, null, 2),
                },
              ],
            };

          case 'read_note':
            const noteContent = await this.obsidianHandler.readNote(args.notePath as string);
            return {
              content: [{ type: 'text', text: noteContent }],
            };

          case 'update_note':
            const updateResult = await this.obsidianHandler.updateNote(
              args.notePath as string,
              args.content as string
            );
            return {
              content: [{ type: 'text', text: updateResult }],
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, errorMessage);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Obsidian MCP Server started');
  }
}

// サーバーを起動
const server = new ObsidianMCPServer();
server.run().catch(console.error);