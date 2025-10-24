import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const defaultConfig: AppConfig = {
  serial: {
    path: 'COM3',
    baudRate: 9600,
    parity: 'none',
    dataBits: 8,
    stopBits: 1,
  },
  mqtt: {
    url: 'mqtt://127.0.0.1:1883'
  },
  server: {
    url: 'mqtt://127.0.0.1:3000'
  }
}

export class AppConfigFile {
  private static instance: AppConfigFile
  private appConfig!: string
  private filepath: string = path.join(app.isPackaged ? path.dirname(process.execPath) : path.resolve(), 'app-config.json');

  private constructor() {}

  static getInstance(): AppConfigFile {
    if(!AppConfigFile.instance) {
      AppConfigFile.instance = new AppConfigFile();
    }

    return AppConfigFile.instance;
  };

  async init() {
    try {
      if(!fs.existsSync(this.filepath)) {
        fs.writeFileSync(this.filepath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      }
    } catch (error) {
      throw error
    }
  }

  async read(): Promise<AppConfig> {
    if(!fs.existsSync(this.filepath)) {
      this.init();
    }

    const content: string = fs.readFileSync(this.filepath, 'utf-8');
    return JSON.parse(content) as AppConfig
  }

  async write(data: AppConfig) {
    fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export const appConfigFileService = AppConfigFile.getInstance();