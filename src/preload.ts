import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  nopolList: (): Promise<string[]|[]> => ipcRenderer.invoke('nopol_list'),
  operatorList: (): Promise<string[]> => ipcRenderer.invoke('operator_list'),
  productList: (): Promise<string[]> => ipcRenderer.invoke('product_list'),
  customerList: (): Promise<string[]> => ipcRenderer.invoke('customer_list'),
  
  validatingUnlockForm: (formData: FormUserValidation): Promise<boolean> => ipcRenderer.invoke('validating_unlock_form', formData),
  dataByVehicleNumber: (vehicleNumber: string): Promise<ResponseDataTimbangan|undefined> => ipcRenderer.invoke('data_by_vehicle_number', vehicleNumber),
  scaleValue: (): Promise<ScaleData> => ipcRenderer.invoke('req_scale_data'),
  processFormData: (formData: DataTimbangan): Promise<ResponseDataTimbangan|undefined> => ipcRenderer.invoke('create_data_form', formData),
  updatingFormData: (id: number, formData: DataTimbangan): Promise<ResponseDataTimbangan|undefined> => ipcRenderer.invoke('update_data_form', id, formData),

  getStatusConn: (): void => ipcRenderer.send('get_status_conn'),
  setFormLock: (): void => ipcRenderer.send('form_locked'),

  // onNotify: (callback: (value:any) => void): void => {
  //   ipcRenderer.on('notify', (_event, value) => callback(value) );
  // },
  // onError: (callback: (errors:any) => void): void => {
  //   ipcRenderer.on('error', (_event, errors) => callback(errors) );
  // },
  onDatetime: (callback: (data: string) => void): void => {
    ipcRenderer.on('datetime', (_event, data) => callback(data));
  },
  onStatusConn: (callback: (data: { mqtt: { status: boolean, url: string, topic: string }, serial: { status: boolean, path: string }}) => void): void => {
    ipcRenderer.on('status_conn', (_event, data) => callback(data) );
  },
  onValidatingUnlockForm: (callback: (result: boolean) => void): void => {
    ipcRenderer.on('on_validating_unlock_form', (_event, result) => callback(result) );
  },
  onScaleDataRT: (callback: (result:any) => void): void => {
    ipcRenderer.on('scale_data', (_event, result) => callback(result));
  },
  // onAppLog: (callback: (result: Log[]) => void): void => {
  //   ipcRenderer.on('app_log', (_event, result) => callback(result));
  // }
});