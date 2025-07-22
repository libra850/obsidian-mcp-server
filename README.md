# Obsidian MCP Server

[English](README.en.md) | 日本語

ObsidianとModel Context Protocol (MCP)を連携させるサーバーです。

## 機能

### 基本機能
- テンプレートを使用したノート作成
- ノートの読み込み・更新
- テンプレート一覧の取得
- タグの管理・検索
- ファイル・ディレクトリ検索

### リンク管理機能（高優先度機能）
- ノート間ウィキリンクの作成
- 壊れたリンクの検出・修復支援
- バックリンク分析とグラフ構造の把握
- Map of Contents（目次ノート）の自動生成

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

## リンク管理ツール（高優先度機能）

### 8. link_notes
ノート間にウィキリンクを作成します。

**パラメータ:**
- `sourceNote` (必須): リンク元ノートパス（vault相対パス）
- `targetNote` (必須): リンク先ノートパス（vault相対パス）
- `linkText` (オプション): 表示テキスト（省略時はファイル名）
- `insertPosition` (オプション): 挿入位置（'end'、'cursor'、または行番号、デフォルト: 'end'）

**機能:**
- ファイル存在チェック
- 重複リンク検出・警告
- 相対パス解決
- ウィキリンク形式 `[[ターゲット|表示テキスト]]` で挿入

### 9. find_broken_links
壊れたリンクの検出と修復支援を行います。

**パラメータ:** なし

**機能:**
- ウィキリンク `[[]]` とMarkdownリンク `[]()` の両方対応
- ファジー検索による修復候補提示
- 大文字小文字、スペース、特殊文字の差異考慮
- 行番号と周辺コンテキストの表示

**戻り値:**
```json
{
  "brokenLinks": [
    {
      "sourceFile": "notes/example.md",
      "linkText": "Missing Note",
      "targetPath": "missing-note",
      "lineNumber": 15,
      "suggestions": ["similar-note", "missing-note-backup"]
    }
  ],
  "totalCount": 1
}
```

### 10. analyze_backlinks
バックリンク分析とグラフ構造の把握を行います。

**パラメータ:**
- `targetNote` (必須): 分析対象のノートパス（vault相対パス）

**機能:**
- 指定されたノートへのバックリンク検出
- リンク周辺のコンテキスト抽出
- 関連ノートの特定
- 人気度と中心性メトリクスの計算

**戻り値:**
```json
{
  "targetNote": "important-concept.md",
  "backlinks": [
    {
      "sourceFile": "notes/research.md",
      "context": "この概念は[[important-concept]]として知られている",
      "linkType": "wiki"
    }
  ],
  "relatedNotes": ["notes/research.md"],
  "metrics": {
    "popularity": 5,
    "centrality": 0.1
  }
}
```

### 11. create_moc
Map of Contents（目次ノート）を自動生成します。

**パラメータ:**
- `title` (必須): MOCのタイトル
- `targetPath` (必須): MOCの保存先パス（vault相対パス）
- `sourcePattern` (オプション): 対象ノートのパターン（省略時は全て）
- `groupBy` (オプション): グループ化方法（'tag'、'folder'、'none'、デフォルト: 'none'）
- `includeDescription` (オプション): 説明を含めるかどうか（デフォルト: false）

**機能:**
- パターンマッチングによるファイル選択
- タグまたはフォルダーによるグループ化
- YAML frontmatterからの説明自動抽出
- ウィキリンク形式での目次生成

**生成例:**
```markdown
# プロジェクト関連ノート

*このMap of Contentsは自動生成されました - 2024-01-15*

## #project
- [[project-planning|プロジェクト計画]] - 新機能の企画と設計
- [[project-timeline|プロジェクトスケジュール]] - 開発スケジュールとマイルストーン

## #development  
- [[api-design|API設計]] - RESTful APIの仕様書
- [[database-schema|データベース設計]] - テーブル構造と関係性
```

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

#### 基本ツールの使用例

```javascript
// テンプレートからノート作成
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

// ノート間リンク作成
await mcp.callTool('link_notes', {
  sourceNote: 'meetings/2024-01-15-project-planning.md',
  targetNote: 'projects/new-feature.md',
  linkText: '新機能プロジェクト',
  insertPosition: 'end'
});
```

#### リンク管理ツールの使用例

```javascript
// 壊れたリンクを検出
const brokenLinks = await mcp.callTool('find_broken_links');

// バックリンク分析
const backlinks = await mcp.callTool('analyze_backlinks', {
  targetNote: 'concepts/important-concept.md'
});

// Map of Contents作成
await mcp.callTool('create_moc', {
  title: 'プロジェクト関連ノート',
  targetPath: 'index/project-moc.md',
  sourcePattern: 'project',
  groupBy: 'tag',
  includeDescription: true
});
```