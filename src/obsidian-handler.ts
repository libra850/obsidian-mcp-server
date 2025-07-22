/**
 * Obsidian Handler
 * 
 * Core functionality for Obsidian vault management including template processing,
 * note operations, tag management, file search, and advanced link management.
 * 
 * @license MIT
 * @copyright 2024 obsidian-mcp-server contributors
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ObsidianConfig, CreateNoteOptions } from './types.js';
import { TemplateEngine } from './template-engine.js';
import { FileUtils } from './utils.js';

export class ObsidianHandler {
  private templateEngine: TemplateEngine;

  constructor(private config: ObsidianConfig) {
    this.templateEngine = new TemplateEngine(
      path.join(config.vaultPath, config.templateDir)
    );
  }

  async createNoteFromTemplate(options: CreateNoteOptions): Promise<string> {
    // パスの検証
    if (!FileUtils.validatePath(this.config.vaultPath, options.outputPath)) {
      throw new Error('無効なファイルパスです');
    }

    // テンプレートを処理
    const content = await this.templateEngine.processTemplate(
      options.templateName,
      options.variables
    );

    // 出力パスを構築
    const fullOutputPath = path.join(this.config.vaultPath, options.outputPath);
    const outputDir = path.dirname(fullOutputPath);

    // ディレクトリを作成
    await FileUtils.ensureDir(outputDir);

    // ファイルの存在チェック
    if (!options.overwrite && await FileUtils.fileExists(fullOutputPath)) {
      throw new Error(`ファイル '${options.outputPath}' は既に存在します`);
    }

    // ファイルを書き込み
    await fs.writeFile(fullOutputPath, content, 'utf-8');

    return `ノート '${options.outputPath}' を作成しました`;
  }

  async readNote(notePath: string): Promise<string> {
    if (!FileUtils.validatePath(this.config.vaultPath, notePath)) {
      throw new Error('無効なファイルパスです');
    }

    const fullPath = path.join(this.config.vaultPath, notePath);
    
    if (!(await FileUtils.fileExists(fullPath))) {
      throw new Error(`ノート '${notePath}' が見つかりません`);
    }

    return await fs.readFile(fullPath, 'utf-8');
  }

  async listTemplates() {
    return await this.templateEngine.getAvailableTemplates();
  }

  async updateNote(notePath: string, content: string): Promise<string> {
    if (!FileUtils.validatePath(this.config.vaultPath, notePath)) {
      throw new Error('無効なファイルパスです');
    }

    const fullPath = path.join(this.config.vaultPath, notePath);
    await fs.writeFile(fullPath, content, 'utf-8');

    return `ノート '${notePath}' を更新しました`;
  }

  async getAllTags(): Promise<string[]> {
    const vaultPath = this.config.vaultPath;
    const tags = new Set<string>();
    
    const processFile = async (filePath: string) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // #tag形式のタグを検索
        const tagMatches = content.match(/#[\w\-\/]+/g);
        if (tagMatches) {
          tagMatches.forEach(tag => tags.add(tag));
        }
        
        // YAML frontmatterのtagsフィールドを検索
        const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (yamlMatch) {
          const yamlContent = yamlMatch[1];
          const tagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            const yamlTags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
            yamlTags.forEach(tag => {
              if (tag) {
                tags.add(tag.startsWith('#') ? tag : `#${tag}`);
              }
            });
          }
        }
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    };
    
    const processDirectory = async (dirPath: string) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            await processDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            await processFile(fullPath);
          }
        }
      } catch (error) {
        // ディレクトリ読み込みエラーは無視
      }
    };
    
    await processDirectory(vaultPath);
    
    return Array.from(tags).sort();
  }

  async renameTag(oldTag: string, newTag: string): Promise<string> {
    const vaultPath = this.config.vaultPath;
    let updatedFilesCount = 0;
    
    // #を自動的に追加
    const oldTagNormalized = oldTag.startsWith('#') ? oldTag : `#${oldTag}`;
    const newTagNormalized = newTag.startsWith('#') ? newTag : `#${newTag}`;
    
    const processFile = async (filePath: string) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        let updatedContent = content;
        let hasChanges = false;
        
        // インラインタグを置換
        const tagPattern = new RegExp(`\\${oldTagNormalized}(?=\\s|$)`, 'g');
        if (tagPattern.test(content)) {
          updatedContent = updatedContent.replace(tagPattern, newTagNormalized);
          hasChanges = true;
        }
        
        // YAML frontmatterのtagsフィールドを置換
        const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (yamlMatch) {
          const yamlContent = yamlMatch[1];
          const tagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            const tagsList = tagsMatch[1];
            const oldTagInYaml = oldTagNormalized.substring(1); // #を除去
            const newTagInYaml = newTagNormalized.substring(1); // #を除去
            
            if (tagsList.includes(oldTagInYaml)) {
              const updatedTagsList = tagsList.replace(
                new RegExp(`(['"]?)${oldTagInYaml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g'),
                `$1${newTagInYaml}$1`
              );
              updatedContent = updatedContent.replace(tagsMatch[0], `tags: [${updatedTagsList}]`);
              hasChanges = true;
            }
          }
        }
        
        if (hasChanges) {
          await fs.writeFile(filePath, updatedContent, 'utf-8');
          updatedFilesCount++;
        }
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    };
    
    const processDirectory = async (dirPath: string) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            await processDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            await processFile(fullPath);
          }
        }
      } catch (error) {
        // ディレクトリ読み込みエラーは無視
      }
    };
    
    await processDirectory(vaultPath);
    
    return `タグ '${oldTagNormalized}' を '${newTagNormalized}' に変更しました。${updatedFilesCount}個のファイルを更新しました。`;
  }

  async searchFiles(searchPath: string = '', pattern: string = ''): Promise<{ path: string; type: 'file' | 'directory' }[]> {
    const basePath = path.join(this.config.vaultPath, searchPath);
    
    if (!FileUtils.validatePath(this.config.vaultPath, searchPath)) {
      throw new Error('無効なパスです');
    }
    
    const results: { path: string; type: 'file' | 'directory' }[] = [];
    
    const processDirectory = async (dirPath: string, relativePath: string = '') => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const entryRelativePath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            if (!pattern || entry.name.includes(pattern)) {
              results.push({ path: entryRelativePath, type: 'directory' });
            }
            await processDirectory(fullPath, entryRelativePath);
          } else if (entry.isFile()) {
            if (!pattern || entry.name.includes(pattern)) {
              results.push({ path: entryRelativePath, type: 'file' });
            }
          }
        }
      } catch (error) {
        // ディレクトリ読み込みエラーは無視
      }
    };
    
    await processDirectory(basePath, searchPath);
    
    return results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.path.localeCompare(b.path);
    });
  }

  async linkNotes(sourceNote: string, targetNote: string, linkText?: string, insertPosition: 'end' | 'cursor' | number = 'end'): Promise<string> {
    if (!FileUtils.validatePath(this.config.vaultPath, sourceNote)) {
      throw new Error('無効なソースノートパスです');
    }
    if (!FileUtils.validatePath(this.config.vaultPath, targetNote)) {
      throw new Error('無効なターゲットノートパスです');
    }

    const sourceFullPath = path.join(this.config.vaultPath, sourceNote);
    const targetFullPath = path.join(this.config.vaultPath, targetNote);

    // ファイル存在チェック
    if (!(await FileUtils.fileExists(sourceFullPath))) {
      throw new Error(`ソースノート '${sourceNote}' が見つかりません`);
    }
    if (!(await FileUtils.fileExists(targetFullPath))) {
      throw new Error(`ターゲットノート '${targetNote}' が見つかりません`);
    }

    // ソースノートの内容を読み込み
    const sourceContent = await fs.readFile(sourceFullPath, 'utf-8');

    // リンクテキストが指定されていない場合はファイル名を使用
    const displayText = linkText || path.basename(targetNote, '.md');
    
    // ターゲットノートパスから .md 拡張子を除去
    const targetNotePath = targetNote.replace(/\.md$/, '');
    
    // ウィキリンク作成
    const wikiLink = `[[${targetNotePath}|${displayText}]]`;

    // 重複リンク検出
    const existingLinkPattern = new RegExp(`\\[\\[${targetNotePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\|[^\\]]+)?\\]\\]`);
    if (existingLinkPattern.test(sourceContent)) {
      return `警告: ターゲット '${targetNote}' への既存のリンクが見つかりました。重複リンクは作成されませんでした。`;
    }

    let updatedContent: string;

    // 挿入位置に応じてリンクを挿入
    if (insertPosition === 'end') {
      updatedContent = sourceContent + '\n' + wikiLink;
    } else if (insertPosition === 'cursor') {
      // cursor位置は実装が困難なため、endと同様に処理
      updatedContent = sourceContent + '\n' + wikiLink;
    } else if (typeof insertPosition === 'number') {
      const lines = sourceContent.split('\n');
      if (insertPosition < 0 || insertPosition > lines.length) {
        throw new Error('無効な挿入位置です');
      }
      lines.splice(insertPosition, 0, wikiLink);
      updatedContent = lines.join('\n');
    } else {
      updatedContent = sourceContent + '\n' + wikiLink;
    }

    // ファイルを更新
    await fs.writeFile(sourceFullPath, updatedContent, 'utf-8');

    return `ノート '${sourceNote}' に '${targetNote}' へのリンクを追加しました`;
  }

  async findBrokenLinks(): Promise<{
    brokenLinks: Array<{
      sourceFile: string;
      linkText: string;
      targetPath: string;
      lineNumber: number;
      suggestions: string[];
    }>;
    totalCount: number;
  }> {
    const vaultPath = this.config.vaultPath;
    const brokenLinks: Array<{
      sourceFile: string;
      linkText: string;
      targetPath: string;
      lineNumber: number;
      suggestions: string[];
    }> = [];

    // すべてのMarkdownファイルを取得
    const allMdFiles = await this.getAllMdFiles(vaultPath);
    const allFileBasenames = allMdFiles.map(file => path.basename(file, '.md'));

    const processFile = async (filePath: string) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const relativeFilePath = path.relative(vaultPath, filePath);

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          
          // ウィキリンク [[]] の検出
          const wikiLinkMatches = line.matchAll(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g);
          for (const match of wikiLinkMatches) {
            const targetPath = match[1];
            const linkText = match[2] ? match[2].substring(1) : targetPath;
            
            // ターゲットファイルの存在確認
            const possiblePaths = [
              path.join(vaultPath, `${targetPath}.md`),
              path.join(vaultPath, targetPath),
            ];

            let exists = false;
            for (const possiblePath of possiblePaths) {
              if (await FileUtils.fileExists(possiblePath)) {
                exists = true;
                break;
              }
            }

            if (!exists) {
              // 修復候補を検索
              const suggestions = this.findSimilarFiles(targetPath, allFileBasenames);
              brokenLinks.push({
                sourceFile: relativeFilePath,
                linkText,
                targetPath,
                lineNumber: lineIndex + 1,
                suggestions,
              });
            }
          }

          // Markdownリンク []() の検出
          const mdLinkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
          for (const match of mdLinkMatches) {
            const linkText = match[1];
            const targetPath = match[2];

            // 内部リンク（.mdファイル）のみチェック
            if (targetPath.endsWith('.md') || !targetPath.includes('://')) {
              const fullTargetPath = path.resolve(path.dirname(filePath), targetPath);
              
              if (!(await FileUtils.fileExists(fullTargetPath))) {
                const suggestions = this.findSimilarFiles(path.basename(targetPath, '.md'), allFileBasenames);
                brokenLinks.push({
                  sourceFile: relativeFilePath,
                  linkText,
                  targetPath,
                  lineNumber: lineIndex + 1,
                  suggestions,
                });
              }
            }
          }
        }
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    };

    // すべてのMarkdownファイルを処理
    for (const filePath of allMdFiles) {
      await processFile(filePath);
    }

    return {
      brokenLinks,
      totalCount: brokenLinks.length,
    };
  }

  private async getAllMdFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const processDirectory = async (currentPath: string) => {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            await processDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // ディレクトリ読み込みエラーは無視
      }
    };
    
    await processDirectory(dirPath);
    return files;
  }

  private findSimilarFiles(targetName: string, allFileBasenames: string[]): string[] {
    const target = targetName.toLowerCase();
    const suggestions: { name: string; score: number }[] = [];

    for (const filename of allFileBasenames) {
      const score = this.calculateSimilarity(target, filename.toLowerCase());
      if (score > 0.3) { // 30%以上の類似度
        suggestions.push({ name: filename, score });
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.name);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    return 1 - distance / Math.max(len1, len2);
  }

  async analyzeBacklinks(targetNote: string): Promise<{
    targetNote: string;
    backlinks: Array<{
      sourceFile: string;
      context: string;
      linkType: 'wiki' | 'markdown';
    }>;
    relatedNotes: string[];
    metrics: {
      popularity: number;
      centrality: number;
    };
  }> {
    if (!FileUtils.validatePath(this.config.vaultPath, targetNote)) {
      throw new Error('無効なターゲットノートパスです');
    }

    const targetFullPath = path.join(this.config.vaultPath, targetNote);
    if (!(await FileUtils.fileExists(targetFullPath))) {
      throw new Error(`ターゲットノート '${targetNote}' が見つかりません`);
    }

    const vaultPath = this.config.vaultPath;
    const backlinks: Array<{
      sourceFile: string;
      context: string;
      linkType: 'wiki' | 'markdown';
    }> = [];

    // ターゲットノートのベース名（拡張子なし）
    const targetBaseName = path.basename(targetNote, '.md');
    
    // すべてのMarkdownファイルを取得
    const allMdFiles = await this.getAllMdFiles(vaultPath);

    const processFile = async (filePath: string) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const relativeFilePath = path.relative(vaultPath, filePath);

        // ターゲットノート自体はスキップ
        if (path.resolve(filePath) === path.resolve(targetFullPath)) {
          return;
        }

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          
          // ウィキリンク [[]] の検出
          const wikiLinkMatches = line.matchAll(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g);
          for (const match of wikiLinkMatches) {
            const linkTarget = match[1];
            
            if (linkTarget === targetBaseName || linkTarget === targetNote || linkTarget === targetNote.replace(/\.md$/, '')) {
              const context = this.extractContext(lines, lineIndex);
              backlinks.push({
                sourceFile: relativeFilePath,
                context,
                linkType: 'wiki',
              });
            }
          }

          // Markdownリンク []() の検出
          const mdLinkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
          for (const match of mdLinkMatches) {
            const linkTarget = match[2];
            
            if (linkTarget.includes(targetBaseName) || linkTarget.includes(targetNote)) {
              const context = this.extractContext(lines, lineIndex);
              backlinks.push({
                sourceFile: relativeFilePath,
                context,
                linkType: 'markdown',
              });
            }
          }
        }
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    };

    // すべてのMarkdownファイルを処理
    for (const filePath of allMdFiles) {
      await processFile(filePath);
    }

    // 関連ノートを計算（バックリンクを持つファイル）
    const relatedNotes = [...new Set(backlinks.map(bl => bl.sourceFile))];

    // メトリクスを計算
    const popularity = backlinks.length;
    const centrality = this.calculateCentrality(backlinks, allMdFiles.length);

    return {
      targetNote,
      backlinks,
      relatedNotes,
      metrics: {
        popularity,
        centrality,
      },
    };
  }

  private extractContext(lines: string[], targetLineIndex: number, contextSize: number = 50): string {
    const line = lines[targetLineIndex];
    const beforeChars = Math.max(0, line.length / 2 - contextSize / 2);
    const afterChars = Math.min(line.length, beforeChars + contextSize);
    
    let context = line.substring(beforeChars, afterChars);
    
    if (beforeChars > 0) {
      context = '...' + context;
    }
    if (afterChars < line.length) {
      context = context + '...';
    }
    
    return context.trim();
  }

  private calculateCentrality(backlinks: Array<any>, totalFiles: number): number {
    // 簡単な中心性指標：バックリンク数を全ファイル数で正規化
    return totalFiles > 0 ? backlinks.length / totalFiles : 0;
  }

  async createMoc(title: string, targetPath: string, sourcePattern?: string, groupBy: 'tag' | 'folder' | 'none' = 'none', includeDescription: boolean = false): Promise<string> {
    if (!FileUtils.validatePath(this.config.vaultPath, targetPath)) {
      throw new Error('無効な保存パスです');
    }

    const vaultPath = this.config.vaultPath;
    const fullTargetPath = path.join(vaultPath, targetPath);
    
    // ディレクトリを作成
    await FileUtils.ensureDir(path.dirname(fullTargetPath));

    // ソースファイルを収集
    const sourceFiles = await this.collectSourceFiles(sourcePattern);
    
    // グループ化
    const groupedFiles = await this.groupFiles(sourceFiles, groupBy);
    
    // MOC内容を生成
    let mocContent = `# ${title}\n\n`;
    mocContent += `*このMap of Contentsは自動生成されました - ${new Date().toISOString().split('T')[0]}*\n\n`;

    if (groupBy === 'none') {
      mocContent += '## 目次\n\n';
      for (const file of sourceFiles) {
        const relativeFilePath = path.relative(vaultPath, file);
        const fileName = path.basename(file, '.md');
        const linkText = `[[${relativeFilePath.replace(/\.md$/, '')}|${fileName}]]`;
        
        if (includeDescription) {
          const description = await this.extractDescription(file);
          mocContent += `- ${linkText}${description ? ` - ${description}` : ''}\n`;
        } else {
          mocContent += `- ${linkText}\n`;
        }
      }
    } else {
      for (const [groupName, files] of Object.entries(groupedFiles)) {
        mocContent += `## ${groupName}\n\n`;
        
        for (const file of files) {
          const relativeFilePath = path.relative(vaultPath, file);
          const fileName = path.basename(file, '.md');
          const linkText = `[[${relativeFilePath.replace(/\.md$/, '')}|${fileName}]]`;
          
          if (includeDescription) {
            const description = await this.extractDescription(file);
            mocContent += `- ${linkText}${description ? ` - ${description}` : ''}\n`;
          } else {
            mocContent += `- ${linkText}\n`;
          }
        }
        mocContent += '\n';
      }
    }

    // ファイルを書き込み
    await fs.writeFile(fullTargetPath, mocContent, 'utf-8');

    return `Map of Contents '${title}' を '${targetPath}' に作成しました。${sourceFiles.length}個のファイルを含みます。`;
  }

  private async collectSourceFiles(sourcePattern?: string): Promise<string[]> {
    const vaultPath = this.config.vaultPath;
    const allMdFiles = await this.getAllMdFiles(vaultPath);
    
    if (!sourcePattern) {
      return allMdFiles;
    }
    
    // パターンマッチング（簡単な実装）
    return allMdFiles.filter(file => {
      const relativePath = path.relative(vaultPath, file);
      return relativePath.includes(sourcePattern) || 
             path.basename(file).includes(sourcePattern);
    });
  }

  private async groupFiles(files: string[], groupBy: 'tag' | 'folder' | 'none'): Promise<Record<string, string[]>> {
    if (groupBy === 'none') {
      return { 'All Files': files };
    }

    const groups: Record<string, string[]> = {};

    for (const file of files) {
      if (groupBy === 'folder') {
        const dir = path.dirname(path.relative(this.config.vaultPath, file));
        const folderName = dir === '.' ? 'ルート' : dir;
        
        if (!groups[folderName]) {
          groups[folderName] = [];
        }
        groups[folderName].push(file);
      } else if (groupBy === 'tag') {
        const tags = await this.extractFileTags(file);
        
        if (tags.length === 0) {
          if (!groups['タグなし']) {
            groups['タグなし'] = [];
          }
          groups['タグなし'].push(file);
        } else {
          for (const tag of tags) {
            if (!groups[tag]) {
              groups[tag] = [];
            }
            groups[tag].push(file);
          }
        }
      }
    }

    return groups;
  }

  private async extractFileTags(filePath: string): Promise<string[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tags = new Set<string>();
      
      // インラインタグ
      const tagMatches = content.match(/#[\w\-\/]+/g);
      if (tagMatches) {
        tagMatches.forEach(tag => tags.add(tag));
      }
      
      // YAML frontmatter
      const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        const tagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);
        if (tagsMatch) {
          const yamlTags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
          yamlTags.forEach(tag => {
            if (tag) {
              tags.add(tag.startsWith('#') ? tag : `#${tag}`);
            }
          });
        }
      }
      
      return Array.from(tags);
    } catch {
      return [];
    }
  }

  private async extractDescription(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // YAML frontmatterの説明を検索
      const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        const descMatch = yamlContent.match(/description:\s*["']?([^"'\n]+)["']?/);
        if (descMatch) {
          return descMatch[1].trim();
        }
      }
      
      // 最初の段落を説明として使用
      const lines = content.split('\n');
      let firstParagraph = '';
      let foundContent = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || trimmed.startsWith('---')) {
          continue;
        }
        if (trimmed.length > 0) {
          firstParagraph = trimmed;
          foundContent = true;
          break;
        }
      }
      
      if (foundContent && firstParagraph.length > 100) {
        return firstParagraph.substring(0, 97) + '...';
      }
      
      return foundContent ? firstParagraph : '';
    } catch {
      return '';
    }
  }
}