import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const defaultStore: AppStore = {
  mqtt: {
    status: false
  },
  scale: {
    status: 'US',
    scale: 0,
    timestamp: ''
  },
  server: {
    status: false,
  },
  serial: {
    status: false,
    data: [],
  },
  formIsLock: true,
  sync_status: {
    data: {
      state: false,
      timestamp: ''
    },
    operator: {
      state: false,
      timestamp: ''
    },
    customer: {
      state: false,
      timestamp: ''
    },
    nopol: {
      state: false,
      timestamp: ''
    },
    product: {
      state: false,
      timestamp: ''
    }
  }
}

export class AppStoreFile {
  private static instance: AppStoreFile
  private filepath: string = path.join(app.isPackaged ? path.dirname(process.execPath) : path.resolve(), 'app-store.json');

  private constructor() {}

  static getInstance(): AppStoreFile {
    if(!AppStoreFile.instance) {
      AppStoreFile.instance = new AppStoreFile();
    }

    return AppStoreFile.instance;
  };

  async init() {
    try {
      if(!fs.existsSync(this.filepath)) {
        fs.writeFileSync(this.filepath, JSON.stringify(defaultStore, null, 2), 'utf-8');
      }
    } catch (error) {
      throw error
    }
  }

  async read(): Promise<AppStore> {
    if(!fs.existsSync(this.filepath)) {
      this.init();
    }

    const content: string = fs.readFileSync(this.filepath, 'utf-8');
    return JSON.parse(content) as AppStore
  }

  async write(data: AppStore) {
    fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async update(updates: (data:AppStore) => void): Promise<void> {
    const content = await this.read();
    const data: AppStore = content;

    updates(data);
    await this.write(data);
  }
}

export const appStoreFileService = AppStoreFile.getInstance()