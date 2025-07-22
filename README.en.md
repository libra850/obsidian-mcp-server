# Obsidian MCP Server

English | [日本語](README.md)

A server that integrates Obsidian with the Model Context Protocol (MCP).

## Features

### Basic Features
- Create notes using templates
- Read and update notes
- List available templates
- Tag management and search
- File and directory search

### Link Management Features (High Priority)
- Create wiki links between notes
- Detect and repair broken links
- Backlink analysis and graph structure insights
- Automatic generation of Map of Contents (MOC)

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

## Link Management Tools (High Priority Features)

### 8. link_notes
Create wiki links between notes.

**Parameters:**
- `sourceNote` (required): Source note path (vault relative path)
- `targetNote` (required): Target note path (vault relative path)
- `linkText` (optional): Display text (defaults to filename if omitted)
- `insertPosition` (optional): Insert position ('end', 'cursor', or line number, default: 'end')

**Features:**
- File existence check
- Duplicate link detection and warning
- Relative path resolution
- Insert in wiki link format `[[target|display text]]`

### 9. find_broken_links
Detect broken links and provide repair assistance.

**Parameters:** None

**Features:**
- Support for both wiki links `[[]]` and Markdown links `[]()`
- Fuzzy search for repair suggestions
- Consideration of case, spaces, and special character differences
- Display line numbers and surrounding context

**Return value:**
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
Perform backlink analysis and graph structure insights.

**Parameters:**
- `targetNote` (required): Target note path for analysis (vault relative path)

**Features:**
- Detect backlinks to specified note
- Extract context around links
- Identify related notes
- Calculate popularity and centrality metrics

**Return value:**
```json
{
  "targetNote": "important-concept.md",
  "backlinks": [
    {
      "sourceFile": "notes/research.md",
      "context": "This concept is known as [[important-concept]]",
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
Automatically generate Map of Contents (MOC) notes.

**Parameters:**
- `title` (required): MOC title
- `targetPath` (required): MOC save path (vault relative path)
- `sourcePattern` (optional): Target note pattern (all if omitted)
- `groupBy` (optional): Grouping method ('tag', 'folder', 'none', default: 'none')
- `includeDescription` (optional): Whether to include descriptions (default: false)

**Features:**
- File selection by pattern matching
- Grouping by tags or folders
- Automatic description extraction from YAML frontmatter
- Generate index in wiki link format

**Generation example:**
```markdown
# Project-Related Notes

*This Map of Contents was auto-generated - 2024-01-15*

## #project
- [[project-planning|Project Planning]] - New feature planning and design
- [[project-timeline|Project Schedule]] - Development schedule and milestones

## #development  
- [[api-design|API Design]] - RESTful API specifications
- [[database-schema|Database Design]] - Table structure and relationships
```

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

#### Basic Tool Usage Examples

```javascript
// Create note from template
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

// Create links between notes
await mcp.callTool('link_notes', {
  sourceNote: 'meetings/2024-01-15-project-planning.md',
  targetNote: 'projects/new-feature.md',
  linkText: 'New Feature Project',
  insertPosition: 'end'
});
```

#### Link Management Tool Usage Examples

```javascript
// Detect broken links
const brokenLinks = await mcp.callTool('find_broken_links');

// Analyze backlinks
const backlinks = await mcp.callTool('analyze_backlinks', {
  targetNote: 'concepts/important-concept.md'
});

// Create Map of Contents
await mcp.callTool('create_moc', {
  title: 'Project-Related Notes',
  targetPath: 'index/project-moc.md',
  sourcePattern: 'project',
  groupBy: 'tag',
  includeDescription: true
});
```