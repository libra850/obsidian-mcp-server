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
        {
          name: 'list_tags',
          description: 'Obsidianボルト内のすべてのタグを一覧表示します',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'rename_tag',
          description: 'Obsidianボルト内のタグを一括でリネームします',
          inputSchema: {
            type: 'object',
            properties: {
              oldTag: {
                type: 'string',
                description: '変更前のタグ名（#付きまたは#なし）',
              },
              newTag: {
                type: 'string',
                description: '変更後のタグ名（#付きまたは#なし）',
              },
            },
            required: ['oldTag', 'newTag'],
          },
        },
        {
          name: 'search_files',
          description: 'Obsidianボルト内のファイルとディレクトリを検索します',
          inputSchema: {
            type: 'object',
            properties: {
              searchPath: {
                type: 'string',
                description: '検索を開始するパス（vault相対パス、省略時はルート）',
                default: '',
              },
              pattern: {
                type: 'string',
                description: '検索パターン（ファイル名の一部、省略時は全て）',
                default: '',
              },
            },
          },
        },
        {
          name: 'link_notes',
          description: 'ノート間にウィキリンクを作成します',
          inputSchema: {
            type: 'object',
            properties: {
              sourceNote: {
                type: 'string',
                description: 'リンク元ノートパス（vault相対パス）',
              },
              targetNote: {
                type: 'string',
                description: 'リンク先ノートパス（vault相対パス）',
              },
              linkText: {
                type: 'string',
                description: '表示テキスト（省略時はファイル名）',
              },
              insertPosition: {
                type: ['string', 'number'],
                description: '挿入位置（end/cursor/行番号）',
                default: 'end',
              },
            },
            required: ['sourceNote', 'targetNote'],
          },
        },
        {
          name: 'find_broken_links',
          description: '壊れたリンクの検出と修復支援を行います',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'analyze_backlinks',
          description: 'バックリンク分析とグラフ構造の把握を行います',
          inputSchema: {
            type: 'object',
            properties: {
              targetNote: {
                type: 'string',
                description: '分析対象のノートパス（vault相対パス）',
              },
            },
            required: ['targetNote'],
          },
        },
        {
          name: 'create_moc',
          description: 'Map of Contents（目次ノート）を自動生成します',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'MOCのタイトル',
              },
              targetPath: {
                type: 'string',
                description: 'MOCの保存先パス（vault相対パス）',
              },
              sourcePattern: {
                type: 'string',
                description: '対象ノートのパターン（省略時は全て）',
              },
              groupBy: {
                type: 'string',
                enum: ['tag', 'folder', 'none'],
                description: 'グループ化方法',
                default: 'none',
              },
              includeDescription: {
                type: 'boolean',
                description: '説明を含めるかどうか',
                default: false,
              },
            },
            required: ['title', 'targetPath'],
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

          case 'list_tags':
            const tags = await this.obsidianHandler.getAllTags();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tags, null, 2),
                },
              ],
            };

          case 'rename_tag':
            const renameResult = await this.obsidianHandler.renameTag(
              args.oldTag as string,
              args.newTag as string
            );
            return {
              content: [{ type: 'text', text: renameResult }],
            };

          case 'search_files':
            const searchResults = await this.obsidianHandler.searchFiles(
              (args.searchPath as string) || '',
              (args.pattern as string) || ''
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(searchResults, null, 2),
                },
              ],
            };

          case 'link_notes':
            const linkResult = await this.obsidianHandler.linkNotes(
              args.sourceNote as string,
              args.targetNote as string,
              args.linkText as string,
              (args.insertPosition as 'end' | 'cursor' | number) || 'end'
            );
            return {
              content: [{ type: 'text', text: linkResult }],
            };

          case 'find_broken_links':
            const brokenLinksResult = await this.obsidianHandler.findBrokenLinks();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(brokenLinksResult, null, 2),
                },
              ],
            };

          case 'analyze_backlinks':
            const backlinksResult = await this.obsidianHandler.analyzeBacklinks(
              args.targetNote as string
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(backlinksResult, null, 2),
                },
              ],
            };

          case 'create_moc':
            const mocResult = await this.obsidianHandler.createMoc(
              args.title as string,
              args.targetPath as string,
              args.sourcePattern as string,
              (args.groupBy as 'tag' | 'folder' | 'none') || 'none',
              (args.includeDescription as boolean) || false
            );
            return {
              content: [{ type: 'text', text: mocResult }],
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