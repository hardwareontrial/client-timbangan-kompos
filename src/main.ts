import { app, BrowserWindow, dialog, ipcMain, net } from 'electron';
import path from 'path';
import moment from 'moment-timezone';
import { sqliteService } from './services/database';
import { appConfigFileService } from './services/app-config';
import { appStoreFileService } from './services/app-store';
import { appLogFileService } from './services/app-log';
import { mqttService } from './services/mqtt'
import { serialLib } from './libs/serial';
import { controllerService } from './services/controller';
import { syncService } from './services/sync';

let mainWindow: BrowserWindow|null = null;
let unlockPeriod: NodeJS.Timeout;
let interval1: NodeJS.Timeout;
let interval2: NodeJS.Timeout;
let interval10: NodeJS.Timeout;

async function createMainWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 640,
    resizable: false,
    show: false,
    icon: path.join(__dirname, '../resources/icon3.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if(!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-frontend/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    interval1 = setInterval(() => {
      const datetime = moment().tz('Asia/Jakarta').format('DD MMM YYYY | HH:mm:ss');
      mainWindow?.webContents.send('datetime', datetime);

      sendScaleData();
      // sendStatus();
    },1000);

    interval2 = setInterval(() => {
      sendStatus();
    }, 2000);
  });

  mainWindow.removeMenu();
  mainWindow.maximize();
  mainWindow.show();
};

/** ***************************************************************************************
 * Two Way Section
 ****************************************************************************************/
ipcMain.handle('customer_list', async () => {
  return await controllerService.getCustomerList()
})

ipcMain.handle('nopol_list', async () => {
  return await controllerService.getNopolList();
})

ipcMain.handle('operator_list', async () => {
  return await controllerService.getOperatorList();
})

ipcMain.handle('product_list', async () => {
  return await controllerService.getProductList();
})

ipcMain.handle('validating_unlock_form', async (_, form:FormUserValidation) => {
  const result = await controllerService.validateUser(form);
  await appStoreFileService.update((data) => { data.formIsLock = result.status });

  if(result.status) {
    unlockPeriod = setTimeout(() => {
      appStoreFileService.update((data) => { data.formIsLock = !result.status });
      mainWindow?.webContents.send('on_validating_unlock_form', !result.status);
    }, 180000); // 3 minutes
  }

  mainWindow?.webContents.send('on_validating_unlock_form', result.status);
  return result.status;
});

ipcMain.handle('data_by_vehicle_number', async(_, number: string) => {
  return await controllerService.getDataByVehicleNum(number);
})

ipcMain.handle('req_scale_data', async () => {
  return await controllerService.getScaleData()
})

ipcMain.handle('create_data_form', async(_, formData:DataTimbangan) => {
  return await controllerService.createDocument(formData);
})

ipcMain.handle('update_data_form', async(_, id:number, formData:DataTimbangan) => {
  const result = await controllerService.updateDocument(id, formData)
  if(result) controllerService.toPrintDocument(result)
  return result;
})
/** ***************************************************************************************
 * End
 ****************************************************************************************/
/*****************************************************************************************
 * One Way (Main--Renderer) Section
 ****************************************************************************************/
ipcMain.on('form_locked', (_event, _) => {
  appStoreFileService.update((data) => {
    data['formIsLock'] = true;
  })
  if(unlockPeriod) clearTimeout(unlockPeriod);
});

ipcMain.on('get_status_conn', (_event, _) => {
  sendStatus();
})
/*****************************************************************************************
 * End
 ****************************************************************************************/
/*****************************************************************************************
 * One Way (Main--Renderer) Section
 ****************************************************************************************/
function sendScaleData() {
  const raw = serialLib.readRawData();
  let value:ScaleData = {
    status: 'US',
    scale: 0,
    timestamp: ''
  };

  if(raw) {
    const parts = raw.split(',');
    if(parts.length >= 3) {
      // console.log(parts)
      const _weight = parts[2];

      value['status'] = parts[0] === 'ST' ? 'ST' : 'US';
      value['scale'] = parseInt(_weight, 10);
    }
    // console.log(value);
  }

  if(mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('scale_data', value);
  }

  if(mqttService.mqttClient && interval2) {
    mqttService.mqttClient.publish('timbangan-kompos/data-timbang-mesin', JSON.stringify(value), { qos: 1 }, (err) => {
      if(err) console.log(`Error publish 'timbangan-kompos/data-timbang-mesin': ${err}`);
    })
  }
}

function sendNotify() {}

function sendError() {}

function sendStatus() {
  controllerService.getStatusData().then(data => {
    if(mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('status_conn', data);
    }
  });
}
/*****************************************************************************************
 * End
 ****************************************************************************************/


async function startApp() {
  await sqliteService.init();
  await appConfigFileService.init();
  await appStoreFileService.init();
  await appLogFileService.init();
  await mqttService.init();
  await serialLib.createConnection();
  
  await syncService.checkAPIHealth();
  await syncService.createOrUpdateCustomerList();
  await syncService.createOrUpdateProductList();
  await syncService.createOrUpdateOperatorList();
  await syncService.createOrUpdateNopolList();

  // console.log({serialData})
}

async function stopApp() {
  console.log('stopApp')
  if(mqttService.mqttClient) {
    mqttService.close();
  }

  if(serialLib.serialPort && serialLib.serialPort.isOpen) {
    serialLib.serialPort.close((err) => {
      if(err) {
        console.log(`Error close serial port: ${err?.message}`)
        appLogFileService.write(`Error close serial port: ${err?.message}`)
      }
    })
  }

  if(syncService) syncService.stopSync();
  if(interval1) clearInterval(interval1)
  if(interval2) clearInterval(interval2)
}

const getLock = app.requestSingleInstanceLock();

if(!getLock) {
  app.quit();
} else {
  app.on('second-instance', (_evt, argv, workingDir) => {
    if(mainWindow?.isMinimized()) mainWindow.restore();
    mainWindow?.focus();
  })
}

["SIGINT", "SIGTERM", "SIGHUP", "SIGABRT"].forEach(signal => {
  process.on(signal, () => { stopApp() });
  // app.quit()
});

app.on('ready', () => {});

app.on('activate', () => {
  if(mainWindow === null) createMainWindow()
});

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  stopApp()
})

app.whenReady().then(() => {

  startApp().then(async () => {
    await createMainWindow()
  });
});