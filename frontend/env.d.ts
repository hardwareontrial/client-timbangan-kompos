import 'vue-router'
import type { CustomInputContent } from '@core/types';

declare module 'vue-router' {
  interface RouteMeta {
    action?: string
    subject?: string
    layoutWrapperClasses?: string
    navActiveLink?: RouteLocationRaw
    layout?: 'blank' | 'default'
    unauthenticatedOnly?: boolean
    public?: boolean
  }
}

declare global {
  interface NotifyInfo {
    visible: boolean
    message: string | undefined
  }

  interface NotifyErrors {
    visible: boolean
    messages: string[] | undefined
  }

  interface Log {
    datetime: string
    message: string
  }

  interface DataScale {
    status: 'ST' | 'US'
    scale: number
    timestamp: string
  }

  interface MqttStatus {
    status: boolean
    url: string
  }

  interface SerialStatus {
    status: boolean
    path: string
  }

  interface Log {
    text: string
    timestamp: string
  }

  interface FormNewData {
    id: number;
    vehicle_number: string;
    document_number: string;
    // transaction_type: string;
    operator: string;
    customer: string;
    product: string;
    send_to: string;
    note: string;
    print_count: number;
    scaling_1_value: number;
    scaling_1_type: string;
    scaling_1_datetime: string;
    scaling_2_value: number;
    scaling_2_type: string;
    scaling_2_datetime: string;
    correction_doc_number: string[];
    sync_status: number;
    sync_datetime: string;
    revision_stat: boolean;
    created_by: string;
    logs: Log[];
    created_at: string;
    updated_at: string;
  }

  interface AdminAuth {
    username: string
    password: string
  }

  type Scales = {
    isFormUnlocked: boolean
    isSubmitUnlockForm: boolean
    isSubmitProcessing: boolean
    getScale1Processing: boolean
    getScale2Processing: boolean
    getDataByVehicleNumProcessing: boolean
    showTransactionOpts: boolean
    onAuthForm: boolean
    onInfo: NotifyInfo
    onErrors: NotifyErrors
    numberPlatesList: string[]
    operatorsList: string[]
    productsList: string[]
    customersList: string[]
    datetime: string
    logs: Log[]
    dataScale: DataScale
    connections: {
      mqtt: MqttStatus,
      serial: SerialStatus,
    }
    formData: FormNewData
    formAdmin: AdminAuth
    transactionOptions_1: CustomInputContent[],
    transactionOptions_2: CustomInputContent[]
  }

  interface Window {
    electronAPI: {
      nopolList: () => Promise<string[]|[]>
      operatorList: () => Promise<string[]|[]>
      productList: () => Promise<string[]|[]>
      customerList: () => Promise<string[]|[]>

      dataByVehicleNumber: (vehicle_number: string) => Promise<FormNewData|undefined>
      validatingUnlockForm: (formData: AdminAuth) => Promise<boolean>
      scaleValue: () => Promise<DataScale>
      processFormData: (formData: FormNewData) => Promise<boolean>
      updatingFormData: (id: number, formData: FormNewData) => Promise<boolean>
      // // appLog: () => Promise<string[]>

      getStatusConn: () => void
      setFormLock: () => void

      // onNotify: (callback: (message: string) => void) => void
      // onError: (callback: (messages: string[]) => void) => void
      onStatusConn: (callback: (data: { mqtt: { status: boolean, url: string, topic: string }, serial: { status: boolean, path: string }}) => void) => void
      onDatetime: (callback: (data: string) => void) => void
      onValidatingUnlockForm: (callback: (result: boolean) => void) => void
      onScaleDataRT: (callback: (result: DataScale) => void) => void
      // onAppLog: (callback: (result: Log[]) => void) => void
    }
  }
}
