# Obsidian MCP Server

English | [日本語](README.md)

A server that integrates Obsidian with the Model Context Protocol (MCP).

## Features

- Create notes using templates
- Read and update notes
- List available templates
- Tag management
- File search functionality

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run build
   ```

3. Set environment variables:
   ```bash
   export OBSIDIAN_VAULT_PATH="/path/to/your/obsidian/vault"
   export OBSIDIAN_TEMPLATE_DIR="TEMPLATE"
   ```
   
   **Note**: Replace `OBSIDIAN_VAULT_PATH` with the actual path to your Obsidian vault.

4. Start the server:
   ```bash
   npm start
   ```

## MCP Configuration

### Configuration for Claude Desktop

1. **Find the configuration file location**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

2. **Check the project path**:
   ```bash
   pwd
   ```
   Use this command to check the absolute path of the project.

3. **Check the Node.js path**:
   ```bash
   which node
   ```
   Use this command to check the path to Node.js.

4. **Edit the configuration file**:
   Add the following configuration to your configuration file:

   **Basic configuration**:
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

   **Configuration example**:
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

   **For troubleshooting (explicitly specify Node.js path)**:
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

   **Important replacement points**:
   - `/path/to/obsidian-mcp-server/dist/server.js` → Actual project path
   - `/path/to/your/obsidian/vault` → Actual Obsidian vault path
   - `/usr/local/bin/node` → Node.js path confirmed with `which node`

5. **Restart Claude Desktop**

### Configuration for Other MCP Clients

For other MCP clients, refer to the following configuration:

- **Command**: `node /path/to/obsidian-mcp-server/dist/server.js`
- **Environment variables**:
  - `OBSIDIAN_VAULT_PATH`: Path to Obsidian vault
  - `OBSIDIAN_TEMPLATE_DIR`: Template directory name

## Available Tools

### 1. create_note_from_template
Create an Obsidian note using a template.

**Parameters:**
- `templateName` (required): Template name in the TEMPLATE folder (without .md extension)
- `variables` (required): Object for replacing variables in the template
- `outputPath` (required): Note save path (vault relative path)
- `overwrite` (optional): Whether to overwrite existing files (default: false)

### 2. list_templates
Get a list of available templates in the TEMPLATE folder.

**Parameters:** None

### 3. read_note
Read the content of an Obsidian note.

**Parameters:**
- `notePath` (required): Path to the note (vault relative path)

### 4. update_note
Update the content of an Obsidian note.

**Parameters:**
- `notePath` (required): Path to the note (vault relative path)
- `content` (required): New note content

### 5. list_tags
List all tags in the Obsidian vault.

**Parameters:** None

### 6. rename_tag
Bulk rename tags in the Obsidian vault.

**Parameters:**
- `oldTag` (required): Old tag name (with or without #)
- `newTag` (required): New tag name (with or without #)

### 7. search_files
Search files and directories in the Obsidian vault.

**Parameters:**
- `searchPath` (optional): Path to start searching (vault relative path, root if omitted)
- `pattern` (optional): Search pattern (part of filename, all if omitted)

## Usage

### Template Creation Example

`TEMPLATE/meeting-notes.md`:
```markdown
---
description: "Template for creating meeting notes"
---

# {{title}}

**Date**: {{date}} {{time}}
**Participants**: {{participants}}

## Agenda
{{agenda}}

## Minutes
{{notes}}

## Action Items for Next Meeting
{{action_items}}
```

### Usage via MCP

```javascript
await mcp.callTool('create_note_from_template', {
  templateName: 'meeting-notes',
  variables: {
    title: 'Project Planning Meeting',
    participants: 'Tanaka, Sato, Yamada',
    agenda: 'New feature specification review',
    notes: '',
    action_items: ''
  },
  outputPath: 'meetings/2024-01-15-project-planning.md'
});
```