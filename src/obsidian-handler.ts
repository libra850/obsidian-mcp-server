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
}