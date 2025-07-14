import { promises as fs } from 'fs';
import path from 'path';

export class FileUtils {
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  static validatePath(basePath: string, targetPath: string): boolean {
    const resolvedBase = path.resolve(basePath);
    const resolvedTarget = path.resolve(basePath, targetPath);
    return resolvedTarget.startsWith(resolvedBase);
  }
}

export class DateUtils {
  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  static getCurrentTime(): string {
    return new Date().toLocaleTimeString('ja-JP', { hour12: false });
  }

  static getCurrentDateTime(): string {
    return new Date().toLocaleString('ja-JP');
  }
}