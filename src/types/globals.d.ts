export {}

declare global {
  interface CustomerRow {
    id: number
    _id: string
    customer: string
  }
  
  interface ProductRow {
    id: number
    _id: string
    product: string
  }

  interface OperatorRow {
    id: number
    _id: string
    operator: string
  }

  interface NopolRow {
    id: number
    _id: string
    nopol: string
    weight: number
  }

  interface ScaleData {
    status: 'ST' | 'US'
    scale: number
    timestamp: string
  }

  interface MqttStatus {
    status: boolean
    url: string
  }

  interface SerialConfig {
    path: string
    baudRate: 2400 | 4800 | 9600 | 11500
    dataBits: 7 | 8
    stopBits: 1 | 2
    parity: 'none' | 'even' | 'odd'
    status: boolean
    lastRecordWeight: number
  }

  interface DataTimbangan {
    vehicle_number: string
    document_number: string
    operator: string
    customer: string
    product: string
    send_to: string
    note: string
    print_count: number
    scaling_1_value: number
    scaling_1_type: string
    scaling_1_datetime: string
    scaling_2_value: number
    scaling_2_type: string
    scaling_2_datetime: string
    correction_doc_number: string[]
    sync_status: number
    sync_datetime: string
    revision_stat: boolean
    created_by: string
    logs: Log[]
    created_at: string
    updated_at: string
  }

  interface ResponseDataTimbangan extends DataTimbangan {
    id: number
  }

  interface Log {
    text: string
    timestamp: string
  }

  interface AppConfig {
    serial: {
      path: SerialConfig['path']
      baudRate: SerialConfig['baudRate']
      parity: SerialConfig['parity']
      dataBits: SerialConfig['dataBits']
      stopBits: SerialConfig['stopBits']
    },
    mqtt: {
      url: MqttStatus['url']
    },
    server: {
      url: string
    }
  }

  interface AppStore {
    mqtt: Pick<MqttStatus, 'status'>
    scale: ScaleData
    server: {
      status: boolean
    },
    serial: {
      status: boolean
      data: string[]
    },
    formIsLock: boolean,
    sync_status: {
      data: {
        state: boolean
        timestamp: string
      }
      operator: {
        state: boolean
        timestamp: string
      }
      customer: {
        state: boolean
        timestamp: string
      }
      product: {
        state: boolean
        timestamp: string
      }
      nopol: {
        state: boolean
        timestamp: string
      }
    }
  }

  interface FormUserValidation {
    username: string
    password: string
  }
}