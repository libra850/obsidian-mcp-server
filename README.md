# Obsidian MCP Server

ObsidianとModel Context Protocol (MCP)を連携させるサーバーです。

## 機能

- テンプレートを使用したノート作成
- ノートの読み込み・更新
- テンプレート一覧の取得

## セットアップ

1. 依存関係のインストール:
   ```bash
   npm install
   ```

2. TypeScriptのコンパイル:
   ```bash
   npm run build
   ```

3. 環境変数の設定:
   ```bash
   export OBSIDIAN_VAULT_PATH="/path/to/your/obsidian/vault"
   export OBSIDIAN_TEMPLATE_DIR="TEMPLATE"
   ```
   
   **注意**: `OBSIDIAN_VAULT_PATH`は実際のObsidianボルトのパスに置き換えてください。

4. サーバーの起動:
   ```bash
   npm start
   ```

## MCP設定方法

### Claude Desktop での設定

1. **設定ファイルの場所を確認**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

2. **プロジェクトのパスを確認**:
   ```bash
   pwd
   ```
   このコマンドでプロジェクトの絶対パスを確認してください。

3. **Node.jsのパスを確認**:
   ```bash
   which node
   ```
   このコマンドでNode.jsのパスを確認してください。

4. **設定ファイルを編集**:
   設定ファイルに以下の設定を追加してください：

   **基本設定**:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "node",
         "args": ["/path/to/obsidian-mcp-server/dist/server.js"],
         "env": {
           "OBSIDIAN_VAULT_PATH": "/path/to/your/obsidian/vault",
           "OBSIDIAN_TEMPLATE_DIR": "TEMPLATE"
         }
       }
     }
   }
   ```

   **設定例**:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "node",
         "args": ["/Users/username/Projects/obsidian-mcp-server/dist/server.js"],
         "env": {
           "OBSIDIAN_VAULT_PATH": "/Users/username/Documents/MyVault",
           "OBSIDIAN_TEMPLATE_DIR": "TEMPLATE"
         }
       }
     }
   }
   ```

   **トラブルシューティング用（Node.jsパスを明示的に指定）**:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "/usr/local/bin/node",
         "args": ["/path/to/obsidian-mcp-server/dist/server.js"],
         "env": {
           "OBSIDIAN_VAULT_PATH": "/path/to/your/obsidian/vault",
           "OBSIDIAN_TEMPLATE_DIR": "TEMPLATE"
         }
       }
     }
   }
   ```

   **重要な置き換えポイント**:
   - `/path/to/obsidian-mcp-server/dist/server.js` → 実際のプロジェクトパス
   - `/path/to/your/obsidian/vault` → 実際のObsidianボルトのパス
   - `/usr/local/bin/node` → `which node`で確認したNode.jsのパス

5. **Claude Desktop を再起動**

### 他のMCPクライアントでの設定

他のMCPクライアントを使用する場合は、以下の設定を参考にしてください:

- **コマンド**: `node /path/to/obsidian-mcp-server/dist/server.js`
- **環境変数**:
  - `OBSIDIAN_VAULT_PATH`: Obsidianボルトのパス
  - `OBSIDIAN_TEMPLATE_DIR`: テンプレートディレクトリ名

## 使用方法

### テンプレート作成例

`TEMPLATE/meeting-notes.md`:
```markdown
---
description: "会議のメモを作成するためのテンプレート"
---

# {{title}}

**日時**: {{date}} {{time}}
**参加者**: {{participants}}

## 議題
{{agenda}}

## 議事録
{{notes}}

## 次回までのアクションアイテム
{{action_items}}
```

### MCP経由での使用

```javascript
await mcp.callTool('create_note_from_template', {
  templateName: 'meeting-notes',
  variables: {
    title: 'プロジェクト計画会議',
    participants: '田中、佐藤、山田',
    agenda: '新機能の仕様検討',
    notes: '',
    action_items: ''
  },
  outputPath: 'meetings/2024-01-15-project-planning.md'
});
```