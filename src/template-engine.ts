import { promises as fs } from 'fs';
import path from 'path';
import { TemplateInfo, TemplateVariable } from './types.js';
import { FileUtils, DateUtils } from './utils.js';

export class TemplateEngine {
  constructor(private templatesDir: string) {}

  async getAvailableTemplates(): Promise<TemplateInfo[]> {
    try {
      const files = await fs.readdir(this.templatesDir);
      const templates: TemplateInfo[] = [];

      for (const file of files) {
        if (file.endsWith('.md')) {
          const templatePath = path.join(this.templatesDir, file);
          const content = await fs.readFile(templatePath, 'utf-8');
          const templateInfo = this.parseTemplate(file, templatePath, content);
          templates.push(templateInfo);
        }
      }

      return templates;
    } catch (error) {
      throw new Error(`テンプレートディレクトリの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async processTemplate(templateName: string, variables: Record<string, any>): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.md`);
    
    if (!(await FileUtils.fileExists(templatePath))) {
      throw new Error(`テンプレート '${templateName}' が見つかりません`);
    }

    const template = await fs.readFile(templatePath, 'utf-8');
    
    // システム変数を追加
    const allVariables = {
      ...variables,
      date: DateUtils.getCurrentDate(),
      time: DateUtils.getCurrentTime(),
      datetime: DateUtils.getCurrentDateTime()
    };

    return this.replaceVariables(template, allVariables);
  }

  private parseTemplate(fileName: string, filePath: string, content: string): TemplateInfo {
    const variables: TemplateVariable[] = [];
    const variableRegex = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const varName = match[1];
      if (!variables.find(v => v.name === varName)) {
        variables.push({ name: varName, required: true });
      }
    }

    // YAMLフロントマターから説明を抽出
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let description = '';
    if (frontMatterMatch) {
      const yamlContent = frontMatterMatch[1];
      const descMatch = yamlContent.match(/description:\s*(.+)/);
      if (descMatch) {
        description = descMatch[1].trim();
      }
    }

    return {
      name: fileName.replace('.md', ''),
      path: filePath,
      variables,
      description
    };
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in variables) {
        return String(variables[key]);
      }
      return match; // 変数が見つからない場合はそのまま残す
    });
  }
}