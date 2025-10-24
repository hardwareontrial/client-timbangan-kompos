import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import moment from 'moment-timezone';

export class AppLogFile {
  private static instance: AppLogFile
  private filepath: string = path.join(app.isPackaged ? path.dirname(process.execPath) : path.resolve(), 'app-log.log');

  private constructor() {}

  static getInstance(): AppLogFile {
    if(!AppLogFile.instance) {
      AppLogFile.instance = new AppLogFile();
    }

    return AppLogFile.instance;
  };

  async init() {
    try {
      if(!fs.existsSync(this.filepath)) {
        fs.appendFileSync(this.filepath, '', 'utf-8')
      }
    } catch (error) {
      throw error
    }
  }

  async read() {}

  async write(log:string) {
    const timestamp = moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm');
    const entry = `[${timestamp}] ${log}\n`;
    fs.appendFileSync(this.filepath, entry, 'utf-8')
  }
}

export const appLogFileService = AppLogFile.getInstance();