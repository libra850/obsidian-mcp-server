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
}