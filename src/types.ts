export interface TemplateVariable {
  name: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface TemplateInfo {
  name: string;
  path: string;
  variables: TemplateVariable[];
  description?: string;
}

export interface CreateNoteOptions {
  templateName: string;
  variables: Record<string, any>;
  outputPath: string;
  overwrite?: boolean;
}

export interface ObsidianConfig {
  vaultPath: string;
  templateDir: string;
}