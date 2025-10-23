import { SerialPort, ReadlineParser } from 'serialport';
import moment from 'moment-timezone';
import { appConfigFileService } from './../services/app-config';
import { appStoreFileService } from './../services/app-store';
import { appLogFileService } from './../services/app-log';
import { controllerService } from '../services/controller';

let stableCount:number = 0;
let lastRecordWeight:number = 0;
let serialReConnPeriod: NodeJS.Timeout;

export class SerialLib {
  private static instance: SerialLib
  public serialPort!: SerialPort
  private rawData:string = '';

  private constructor() {}

  static getInstance(): SerialLib {
    if(!SerialLib.instance) {
      SerialLib.instance = new SerialLib();
    }

    return SerialLib.instance;
  };

  async createConnection() {
    try {
      const config:AppConfig = await appConfigFileService.read();

      console.log('[INFO] Inisiasi Serial Port...');
      appLogFileService.write('[INFO] Inisiasi Serial Port...');

      if(this.serialPort && this.serialPort.isOpen) {
        this.serialPort.removeAllListeners();
        this.serialPort.close();
      }

      this.serialPort = new SerialPort({
        path: config['serial']['path'],
        baudRate: config['serial']['baudRate'],
        parity: config['serial']['parity'],
        dataBits: config['serial']['dataBits'],
        stopBits: config['serial']['stopBits'],
        autoOpen: false,
      });

      this.serialPort.open((err) => {
        if(err) {
          console.log(`[ERR] Error open port ${config['serial']['path']}: ${err?.message}`);
          appLogFileService.write(`[ERR] Error open port ${config['serial']['path']}: ${err?.message}`);
          this.reConnect()
        }
      });

      const parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n'}));
      parser.on('data', (line: string) => {
        this.rawData = line;
        const parts = line.split(',');
        if(parts.length < 3) return;

        const _status = parts[0];
        const _weight = parts[2];
        const numericWeight = parseInt(_weight, 10);

        if(_status === 'ST') {
          if(lastRecordWeight === numericWeight) return;
          lastRecordWeight = numericWeight;
          stableCount = stableCount +1;

          if(stableCount === 6) {
            appStoreFileService.update((data) => {
              data.scale.status = 'ST'
              data.scale.scale = lastRecordWeight
              data.scale.timestamp = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
            });

            stableCount = 0;
          }
        } else {
          stableCount = 0;
        }
      });

      this.serialPort.on('open', async () => {
        if(serialReConnPeriod) { clearTimeout(serialReConnPeriod) }
        console.log(`Port ${config['serial']['path']} terbuka.`);
        appLogFileService.write(`Port ${config['serial']['path']} terbuka.`);

        appStoreFileService.update((data) => {
          data.serial.status = true
        });
        this.rawData = '';
      });

      this.serialPort.on('close', async () => {
        console.log(`Port ${config['serial']['path']} ditutup.`);
        appLogFileService.write(`Port ${config['serial']['path']} ditutup.`);

        appStoreFileService.update((data) => {
          data.serial.status = false
        });
        this.rawData = '';
      });

      this.serialPort.on('error', async (err) => {
        console.log(`Error port ${config['serial']['path']}: ${err?.message}`);
        appLogFileService.write(`Error port ${config['serial']['path']}: ${err?.message}`);

        appStoreFileService.update((data) => {
          data.serial.status = false
        });
        this.rawData = '';
      })
    } catch (error) {
      console.error(error)
    }
  }

  reConnect() {
    if(serialReConnPeriod) return;
    serialReConnPeriod = setTimeout(() => {
      console.log(`Koneksi ulang ke port serial dalam 5 detik...`);
      appLogFileService.write(`Koneksi ulang ke port serial dalam 5 detik...`);

      this.createConnection()
    },5000)
  }

  readRawData() {
    return this.rawData;
  }
}

export const serialLib = SerialLib.getInstance();