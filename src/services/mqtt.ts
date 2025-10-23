import mqtt, { MqttClient } from 'mqtt';
import { appConfigFileService } from './app-config';
import { appStoreFileService } from './app-store';
import { appLogFileService } from './app-log';
import { sqliteService } from './database';
import { syncService } from './sync';

let publishStatusPeriod:NodeJS.Timeout;
let syncDataPeriod:NodeJS.Timeout;

export class MqttService {
  private static instance: MqttService
  public mqttClient!: MqttClient

  private constructor() {}

  static getInstance(): MqttService {
    if(!MqttService.instance) {
      MqttService.instance = new MqttService();
    }

    return MqttService.instance;
  };

  async init() {
    try {
      const config:AppConfig = await appConfigFileService.read();
      let store:AppStore = await appStoreFileService.read();

      console.log(`[INFO] Inisiasi Mqtt Client...`);
      appLogFileService.write('[INFO] Inisiasi Mqtt Client...')

      this.mqttClient = mqtt.connect(config.mqtt.url, {
        clientId: 'timbangan-client-001',
        clean: true,
        reconnectPeriod: 3000,
        will: {
          topic: 'timbangan-kompos/client-status',
          payload: JSON.stringify({status: false}),
          qos: 1,
          retain: true
        }
      });

      this.mqttClient.on('connect', () => {
        console.log(`[INFO] Mqtt Client terhubung`);
        appLogFileService.write('[INFO] Mqtt Client terhubung');

        appStoreFileService.update((data) => { data.mqtt.status = true });

        if(!syncDataPeriod) {
          syncDataPeriod = setInterval(async () => {
            await syncService.createOrUpdateCustomerList();
            await syncService.createOrUpdateNopolList();
            await syncService.createOrUpdateOperatorList();
            await syncService.createOrUpdateProductList();
            await syncService.syncData();
          }, 10000);
        }

        if(!publishStatusPeriod) {
          publishStatusPeriod = setInterval(() => {
            this.mqttClient.publish('timbangan-kompos/data-timbang-mesin', JSON.stringify(''), { qos: 1 }, (err) => {
              if(err) console.log(`Error publish 'timbangan-kompos/data-timbang-mesin': ${err}`);
            })
      
            this.mqttClient.publish('timbangan-kompos/client-status', JSON.stringify({status: true}), { qos: 1}, (err) => {
              if(err) console.log(`Error publish 'timbangan-kompos/client-status': ${err}`);
            })
          }, 5000)
        }
      });

      this.mqttClient.on('end', () => {
        console.log(`[INFO] Mqtt Client putus`);
        appLogFileService.write('[INFO] Mqtt Client putus');

        appStoreFileService.update((data) => {
          data.mqtt.status = false
        });

        if(publishStatusPeriod) clearInterval(publishStatusPeriod);
        if(syncDataPeriod) clearInterval(syncDataPeriod)
      });

      this.mqttClient.on('close', () => {
        console.log(`[INFO] Mqtt Client ditutup`);
        appLogFileService.write('[INFO] Mqtt Client ditutup');

        appStoreFileService.update((data) => {
          data.mqtt.status = false
        });

        if(publishStatusPeriod) clearInterval(publishStatusPeriod);
        if(syncDataPeriod) clearInterval(syncDataPeriod);
      });

      this.mqttClient.on('error', (err) => {
        console.log(`[ERR] Mqtt Client: ${err?.message}`);
        appLogFileService.write(`[ERR] Mqtt Client: ${err?.message}`);

        appStoreFileService.update((data) => {
          data.mqtt.status = false
        });

        if(publishStatusPeriod) clearInterval(publishStatusPeriod);
        if(syncDataPeriod) clearInterval(syncDataPeriod);
      });

      this.mqttClient.on('offline', () => {
        console.log(`[INFO] Mqtt Client server offline`);
        appLogFileService.write(`[INFO] Mqtt Client server offline`);

        appStoreFileService.update((data) => {
          data.mqtt.status = false
        });

        // if(publishStatusPeriod) clearInterval(publishStatusPeriod);
        if(syncDataPeriod) clearInterval(syncDataPeriod)
      });

    } catch (error) {
      throw error
    }
  }

  async close() {
    if(this.mqttClient?.connected) this.mqttClient.end(true)
  }
}

export const mqttService = MqttService.getInstance();
export const mqttClientInstance = mqttService.mqttClient;