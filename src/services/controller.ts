import { BrowserWindow, ipcMain, IpcMain } from 'electron';
import { sqliteService } from './database'
import { appStoreFileService } from './app-store';
import moment from 'moment-timezone';
import { appConfigFileService } from './app-config';
import { serialLib } from '../libs/serial';

export class ControllerService {
  private static instance: ControllerService
  public controller!: ControllerService
  public unlockFormPeriod!: NodeJS.Timeout

  private constructor() {}

  static getInstance(): ControllerService {
    if(!ControllerService.instance) {
      ControllerService.instance = new ControllerService();
    }

    return ControllerService.instance;
  };
  
  async init() {}

  async getCustomerList(): Promise<string[]> {
    try {
      const data:CustomerRow[] = await sqliteService.getCustomerData();
      if(data.length <= 0) return [];
      return data.map(item => item.customer) as string[]
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on getCustomerList: ${error?.message}`)
      throw error;
    }
  }

  async getNopolList(): Promise<string[]> {
    try {
      const data:NopolRow[] = await sqliteService.getNopolData();
      if(data.length <= 0) return [];
      return data.map(item => item.nopol) as string[]
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on getNopolList: ${error?.message}`)
      throw error;
    }
  }

  async getOperatorList(): Promise<string[]> {
    try {
      const data:OperatorRow[] = await sqliteService.getOperatorData();
      if(data.length <= 0) return [];
      return data.map(item => item.operator) as string[]
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on getOperatorList: ${error?.message}`)
      throw error;
    }
  }

  async getProductList(): Promise<string[]> {
    try {
      const data:ProductRow[] = await sqliteService.getProductData();
      if(data.length <= 0) return [];
      return data.map(item => item.product) as string[]
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on getProductList: ${error?.message}`)
      throw error;
    }
  }

  async validateUser(form:FormUserValidation): Promise<{status: boolean, message:string}> {
    try {
      const { username, password } = form;
      const result = await sqliteService.validateUser(username, password);
      return result
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on validateUser: ${error?.message}`)
      throw error;
    }
  }

  async getDataByVehicleNum(number:string): Promise<ResponseDataTimbangan|undefined> {
    try {
      return await sqliteService.getDataByVehicleNum(number);
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on getDataByVehicleNum: ${error?.message}`)
      throw error;
    }
  }

  async getScaleData(): Promise<ScaleData> {
    const raw = serialLib.readRawData();
    const now = this.getDatetime();
    let result: ScaleData = {
      timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
      scale: 0,
      status: 'US'
    }

    if(raw) {
      const parts = raw.split(',');
      if(parts.length >= 3) {
        const _weight = parts[2];

        result['status'] = parts[0] === 'ST' ? 'ST' : 'US';
        result['scale'] = parseInt(_weight, 10);
      }
    }
    return result
  }

  async createDocument(form:DataTimbangan): Promise<ResponseDataTimbangan|undefined> {
    try {
      if(form.scaling_1_datetime === '') {
        form['scaling_1_datetime'] = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
      }

      const created = await sqliteService.createData(form);
      return created
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on createDocument: ${error?.message}`)
      throw error;
    }
  }

  async updateDocument(id:number, form:DataTimbangan): Promise<ResponseDataTimbangan|undefined> {
    try {
      if(form.scaling_2_datetime === '') {
        form['scaling_2_datetime'] = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
      }

      const updated = await sqliteService.updateData(id, form);
      return updated
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on updateDocument: ${error?.message}`)
      throw error;
    }
  }

  async toPrintDocument(data:ResponseDataTimbangan): Promise<void> {
    function thousandNumbering(number: number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function calculateWeight(dataTimbang: DataTimbangan) {
      const entries: {index: number, value: any, type: any, timestamp: any}[] = [];
      const indices = new Set();
      for(const key in dataTimbang) {
        const match = key.match(/scaling_(\d+)_value/);
        if(match) indices.add(match[1]);
      }

      indices.forEach((idx) => {
        const valueKey = `scaling_${idx}_value` as keyof DataTimbangan;
        const typeKey = `scaling_${idx}_type` as keyof DataTimbangan;
        const timestampKey = `scaling_${idx}_datetime` as keyof DataTimbangan;
        if(dataTimbang[valueKey] !== undefined && dataTimbang[typeKey] !== undefined) {
          entries.push({
            index: 0,
            value: dataTimbang[valueKey],
            type: dataTimbang[typeKey],
            timestamp: dataTimbang[timestampKey]
          })
        };
      });

      if(entries.length === 0) return {
        gross: { value: 0, timestamp: '' },
        tare: { value: 0, timestamp: '' },
        net: 0
      };
      let gross = entries[0];
      let tare = entries[0];

      entries.forEach(entry => {
        if(entry.value > gross.value) gross = entry;
        if(entry.value < tare.value) tare = entry;
      });
      const netValue = gross.value - tare.value;
      return {
        gross: { value: gross.value, timestamp: moment(gross.timestamp).tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss') },
        tare: { value: tare.value, timestamp: moment(tare.timestamp).tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss') },
        net: netValue
      }
    }

    try {
      let { print_count } = data;
      print_count = print_count +1;
      
      const weights = calculateWeight(data);
      const winPrint:BrowserWindow = new BrowserWindow({ show: false });

      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @media print {
                html, body {
                  margin: 0mm 0mm 0mm 0mm;
                  width: 125mm;
                  height: 155mm;
                  font-size: 10pt;
                }

                footer {
                  position: fixed;
                  bottom: 0;
                  width: 100%;
                  text-align: end;
                  font-size: 8pt;
                }
              }
            </style>
          </head>
          <body>
            <table style="border-collapse: collapse; width: 100%">
              <tr>
                <td style="font-size: 1.2em;">PT. MOLINDO RAYA INDUSTRIAL</td>
              </tr>
              <tr>
                <td style="font-size: 1.1em">BAGIAN PRODUKSI PUPUK</td>
              </tr>
              <table class="table" style="margin-top: 50px;">
                <tr>
                  <td>SLIP TIMBANG</td>
                </tr>
              </table>
            </table>
            <table style="width:100%; margin-top: 5px; border: 1pt solid black">
              <tr>
                <td style="width: 14%">No.Doc</td>
                <td style="width: 2%">:</td>
                <td style="width: 34%">${data.document_number}</td>
                <td style="width: 14%">Customer</td>
                <td style="width: 2%">:</td>
                <td style="width: 34%">${data.customer}</td>
              </tr>
              <tr>
                <td>Rit Ke</td>
                <td>:</td>
                <td></td>
              </tr>
              <tr>
                <td>No.Truck</td>
                <td>:</td>
                <td>${data.vehicle_number}</td>
                <td>Produk</td>
                <td>:</td>
                <td>${data.product}</td>
              </tr>
              <tr>
                <td>Pengemudi</td>
                <td>:</td>
                <td>${data.operator}</td>
                <td>Tujuan</td>
                <td>:</td>
                <td>${data.send_to}</td>
              </tr>
          </table>
            <table style="width:100%; margin-top: 10px; margin-bottom: 5px;">
              <tr>
                <td style="width: 30%"></td>
                <td style="width: 30%"></td>
                <td></td>
                <td style="width: 20%">Tanggal</td>
                <td></td>
                <td></td>
              </tr>
            </table>
            <table style="width:100%">
              <tr>
                <td style="width: 15%;text-align: left; line-height: 1.5;">Gross</td>
                <td style="width: 2%; text-align: center;">:</td>
                <td style="width: 15%; text-align: right;">${thousandNumbering(weights.gross.value)}</td>
                <td style="width: 5%; text-align: center;">Kg</td>
                <td style="width: 15%"></td>
                <td>${weights.gross.timestamp}</td>
              </tr>
              <tr>
                <td style="width: 15%; text-align: left; line-height: 1.5;">Tare</td>
                <td style="width: 2%; text-align: center;">:</td>
                <td style="width: 15%; text-align: right;border-bottom: double;">${thousandNumbering(weights.tare.value)}</td>
                <td style="width: 5%; text-align: center;">Kg</td>
                <td style="width: 15%"></td>
                <td>${weights.tare.timestamp}</td>
              </tr>
              <tr>
                <td style="width: 15%; text-align: left; line-height: 1.5;">Netto</td>
                <td style="width: 2%; text-align: center;">:</td>
                <td style="width: 15%; text-align: right;">${thousandNumbering(weights.net)}</td>
                <td style="width: 5%; text-align: center;">Kg</td>
                <td></td>
                <td></td>
              </tr>
            </table>
            <table style="width:100%; margin-top:8px;">
              <tr>
                <td style="width: 15%"></td>
                <td style="width: 15%"></td>
                <td style="width: 15%"></td>
                <td style="width: 15%"></td>
                <td style="width: 35%"></td>
                <td></td>
              </tr>
              <tr>
                <td style="width: 15%" colspan="4">
                  <span style="font-size: 8pt">Dicetak pada: ${moment().tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss')} | R-${data.print_count}</span>
                </td>
                <td style="width: 35%; text-align: center">Operator Timbang</td>
                <td></td>
              </tr>
            </table>
            <footer></footer>
          </body>
        </html>
      `;

      winPrint.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);
      winPrint.webContents.on('did-finish-load', () => {
        winPrint?.webContents.print({
          silent: false,
          printBackground: true,
          margins: { marginType: 'none' }
        },(success) => {
          winPrint?.close()
        })
      })

      await this.updateDocument(data.id, data);
    } catch (error) {
      if(error instanceof Error) console.log(`[ERR] Error on toPrintDocument: ${error?.message}`)
      throw error;
    }
  }

  getDatetime() {
    return moment().tz('Asia/Jakarta');
  }

  removeEmitter() {
    // if(this.mainWindow) {
    //   clearInterval(this.dataSendingContPeriode)
    //   clearInterval(this.readStorePeriode)
    // }
  }

  async getStatusData() {
    const store = await appStoreFileService.read();
    const config = await appConfigFileService.read();
    return {
      mqtt: { status: store['mqtt']['status'], url: config['mqtt']['url'], topic: '' },
      serial: { status: store['serial']['status'], path: config['serial']['path'] }
    }
  }
}

export const controllerService = ControllerService.getInstance();