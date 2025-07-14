# Obsidian MCP Server

[English](README.en.md) | 日本語

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

## 利用可能なツール

### 1. create_note_from_template
テンプレートを使用してObsidianノートを作成します。

**パラメータ:**
- `templateName` (必須): TEMPLATEフォルダ内のテンプレート名（.md拡張子なし）
- `variables` (必須): テンプレート内の変数を置換するためのオブジェクト
- `outputPath` (必須): ノートの保存先パス（vault相対パス）
- `overwrite` (オプション): 既存ファイルを上書きするかどうか（デフォルト: false）

### 2. list_templates
TEMPLATEフォルダ内の利用可能なテンプレート一覧を取得します。

**パラメータ:** なし

### 3. read_note
Obsidianノートの内容を読み込みます。

**パラメータ:**
- `notePath` (必須): ノートのパス（vault相対パス）

### 4. update_note
Obsidianノートの内容を更新します。

**パラメータ:**
- `notePath` (必須): ノートのパス（vault相対パス）
- `content` (必須): 新しいノートの内容

### 5. list_tags
Obsidianボルト内のすべてのタグを一覧表示します。

**パラメータ:** なし

### 6. rename_tag
Obsidianボルト内のタグを一括でリネームします。

**パラメータ:**
- `oldTag` (必須): 変更前のタグ名（#付きまたは#なし）
- `newTag` (必須): 変更後のタグ名（#付きまたは#なし）

### 7. search_files
Obsidianボルト内のファイルとディレクトリを検索します。

**パラメータ:**
- `searchPath` (オプション): 検索を開始するパス（vault相対パス、省略時はルート）
- `pattern` (オプション): 検索パターン（ファイル名の一部、省略時は全て）

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