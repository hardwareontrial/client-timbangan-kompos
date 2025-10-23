import fetch, { Response, Request } from 'node-fetch';
import moment from "moment-timezone";
import { appConfigFileService } from './app-config';
import { sqliteService } from './database';
import { appStoreFileService } from './app-store';
import { controllerService } from './controller';
import { appLogFileService } from './app-log';

export class SyncService {
  private static instance: SyncService
  private syncDataPeriod!: NodeJS.Timeout

  private constructor() {}

  static getInstance(): SyncService {
    if(!SyncService.instance) {
      SyncService.instance = new SyncService();
    }

    return SyncService.instance;
  };

  async checkAPIHealth(): Promise<boolean> {
    try {
      const config = await appConfigFileService.read();
      const url = config['server']['url'];

      const result:Response = await fetch(`${url}/api/health`, { method: 'HEAD' });
      appStoreFileService.update((data) => {
        data['server']['status'] = result.ok
      });
      return result.ok
    } catch (e) {
      if(e instanceof Error) console.error(e?.message)
      return false
    }
  }

  async syncData(): Promise<void> {
    try {
      const config = await appConfigFileService.read();
      const store = await appStoreFileService.read();
      const url = config['server']['url'];

      const connServer = store['server']['status'];
      // const isHealth:boolean = await this.checkAPIHealth();
      if(!connServer) { return };

      const _rows = await sqliteService.dataUnSync();
      for(const element of _rows) {
        try {
          let formData: ResponseDataTimbangan = element;
          
          const now = controllerService.getDatetime();
          const _idRow = formData.id;
          formData['sync_status'] = 1;
          formData['sync_datetime'] = moment(now).format('YYYY-MM-DD HH:mm:ss');

          const data = {
            isRevision: false,
            formData,
          }

          const response = await fetch(`${url}/timbangan-kompos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if(!response.ok) {
            await appStoreFileService.update((data) => {
              data['sync_status']['data']['state'] = false;
              data['sync_status']['data']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
            });
            break;
          };
          
          await sqliteService.deleteData(formData);
          await appStoreFileService.update((data) => {
            data['sync_status']['data']['state'] = true;
            data['sync_status']['data']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
          });
        } catch (error) {
          if(error instanceof Error) appLogFileService.write(`Error saat sync data: ${error?.message}`)
          break;
        }
      }
    } catch (error) {
      console.error(`Error on sync: ${error}`);
    }
  }

  async createOrUpdateCustomerList(): Promise<void> {
    try {
      const config = await appConfigFileService.read();
      const url = config['server']['url'];
      const store = await appStoreFileService.read();
      const connServer = store['server']['status'];
      // const isHealth:boolean = await this.checkAPIHealth();
      if(!connServer) { return };

      const rows = await fetch(`${url}/api/timbangan-kompos/customers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const now = controllerService.getDatetime();
      if(rows.ok) {
        const response: any = await rows.json();
        if(response.length) {
          response.forEach((item:{_id:string, customer:string, _v:number}) => {
            sqliteService.createOrUpdateCustomer(item._id, item.customer)
          });
        }

        await appStoreFileService.update((data) => {
          data['sync_status']['customer']['state'] = true;
          data['sync_status']['customer']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
        });
      } else {
        await appStoreFileService.update((data) => {
          data['sync_status']['customer']['state'] = false;
          data['sync_status']['customer']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
        });
      }
    } catch (e) {
      throw e;
    }
  }

  async createOrUpdateProductList(): Promise<void> {
    try {
      const config = await appConfigFileService.read();
      const url = config['server']['url'];
      const store = await appStoreFileService.read();
      const connServer = store['server']['status'];
      // const isHealth:boolean = await this.checkAPIHealth();
      if(!connServer) { return };

      const rows = await fetch(`${url}/api/timbangan-kompos/products`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const now = controllerService.getDatetime();
      if(rows.ok) {
        const response: any = await rows.json();
        if(response.length) {
          response.forEach((item:{_id:string, product:string, _v:number}) => {
            sqliteService.createOrUpdateProduct(item._id, item.product)
          });
        }
        await appStoreFileService.update((data) => {
          data['sync_status']['product']['state'] = true;
          data['sync_status']['product']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
        });
      } else {
        await appStoreFileService.update((data) => {
          data['sync_status']['product']['state'] = false;
          data['sync_status']['product']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
        });
      }
    } catch (e) {
      throw e;
    }
  }

  async createOrUpdateOperatorList(): Promise<void> {
    try {
      const config = await appConfigFileService.read();
      const url = config['server']['url'];
      const store = await appStoreFileService.read();
      const connServer = store['server']['status'];
      // const isHealth:boolean = await this.checkAPIHealth();
      if(!connServer) { return };

      const rows = await fetch(`${url}/api/timbangan-kompos/operators`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const now = controllerService.getDatetime();
      if(rows.ok) {
        const response: any = await rows.json();
        if(response.length) {
          response.forEach((item:{_id:string, operator:string, _v:number}) => {
            sqliteService.createOrUpdateOperator(item._id, item.operator)
          });
        }
        await appStoreFileService.update((data) => {
          data['sync_status']['operator']['state'] = true;
          data['sync_status']['operator']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
        });
      } else {
        await appStoreFileService.update((data) => {
          data['sync_status']['operator']['state'] = false;
          data['sync_status']['operator']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
        });
      }
    } catch (e) {
      throw e;
    }
  }

  async createOrUpdateNopolList(): Promise<void> {
    try {
      const config = await appConfigFileService.read();
      const url = config['server']['url'];
      const store = await appStoreFileService.read();
      const connServer = store['server']['status'];
      // const isHealth:boolean = await this.checkAPIHealth();
      if(!connServer) { return };

      const rows = await fetch(`${url}/api/timbangan-kompos/nopols`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const now = controllerService.getDatetime();
      if(rows.ok) {
        const response: any = await rows.json();
        if(response.length) {
          response.forEach((item:{_id:string, nopol:string, weight:number, _v:number}) => {
            sqliteService.createOrUpdateNopol(item._id, item.nopol, item.weight)
          });
        }
        await appStoreFileService.update((data) => {
          data['sync_status']['nopol']['state'] = true;
          data['sync_status']['nopol']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
        });
      } else {
        await appStoreFileService.update((data) => {
          data['sync_status']['nopol']['state'] = false;
          data['sync_status']['nopol']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss')
        });
      }
    } catch (e) {
      console.log(e)
      throw e;
    }
  }

  stopSync() {
    const now = controllerService.getDatetime();
    appStoreFileService.update((data) => {
      data['server']['status'] = false
      data['sync_status']['data']['state'] = false;
      data['sync_status']['operator']['state'] = false;
      data['sync_status']['customer']['state'] = false;
      data['sync_status']['product']['state'] = false;
      data['sync_status']['nopol']['state'] = false;
      data['sync_status']['data']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss');
      data['sync_status']['operator']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss');
      data['sync_status']['customer']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss');
      data['sync_status']['product']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss');
      data['sync_status']['nopol']['timestamp'] = moment(now).format('YYYY-MM-DD HH:mm:ss');
    });
  }
}

export const syncService = SyncService.getInstance()