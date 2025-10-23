export const useScalesStore = defineStore('scalesStore', {
  state: (): Scales => ({
    isFormUnlocked: false,
    isSubmitUnlockForm: false,
    isSubmitProcessing: false,
    getScale1Processing: false,
    getScale2Processing: false,
    getDataByVehicleNumProcessing: false,
    showTransactionOpts: false,
    onAuthForm: false,
    onInfo: {
      visible: false,
      message: ''
    },
    onErrors: {
      visible: false,
      messages: []
    },
    numberPlatesList: [],
    operatorsList: [],
    productsList: [],
    customersList: [],
    datetime: '',
    logs: [],
    dataScale: {
      scale: 0,
      status: 'ST',
      timestamp: ''
    },
    connections: {
      mqtt: {
        url: '',
        status: false
      },
      serial: {
        path: '',
        status: false
      }
    },
    formData: {
      id: 0,
      vehicle_number: '',
      document_number: '',
      // transaction_type: '',
      operator: '',
      customer: '',
      product: '',
      send_to: '',
      note: '',
      print_count: 0,
      scaling_1_value: 0,
      scaling_1_type: '',
      scaling_1_datetime: '',
      scaling_2_value: 0,
      scaling_2_type: '',
      scaling_2_datetime: '',
      correction_doc_number: [],
      sync_status: 0,
      sync_datetime: '',
      revision_stat: false,
      created_by: '',
      logs: [],
      created_at: '',
      updated_at: ''
    },
    formAdmin: {
      username: '',
      password: ''
    },
    transactionOptions_1: [
      {
        title: 'Timbang Isi *',
        desc: `Timbang pertama 'dengan' muatan`,
        value: 'timbang-in',
        subtitle: ''
      },
      {
        title: 'Timbang Kosong  *',
        desc: `Timbang pertama 'tanpa' muatan`,
        value: 'timbang-out',
        subtitle: ''
      }
    ],
    transactionOptions_2: [
      {
        title: 'Timbang Isi *',
        desc: `Timbang kedua 'dengan' muatan`,
        value: 'timbang-in',
        subtitle: ''
      },
      {
        title: 'Timbang Kosong  *',
        desc: `Timbang kedua 'tanpa' muatan`,
        value: 'timbang-out',
        subtitle: ''
      }
    ],
  }),
  actions: {
    setFormLockStatus(value: boolean): void {
      this.isFormUnlocked = value
      this.resetForm()
    },
    setScale1Status(value: boolean = false): void {
      this.getScale1Processing = value
    },
    setScale2Status(value: boolean = false): void {
      this.getScale2Processing = value
    },
    setNotify(visible: boolean = false, message: string= ''): void {
      this.onInfo['message'] = message;
      this.onInfo['visible'] = visible;
      setTimeout(() => this.setNotify(), 8000);
    },
    setErrors(visible: boolean = false, messages: Array<string> = []): void {
      this.onErrors['messages'] = messages;
      this.onErrors['visible'] = visible;
    },
    closingErrorDialog(): void {
      this.setErrors();
    },
    closeAuthModal(): void {
      this.onAuthForm = false;
      this.formAdmin.username = '';
      this.formAdmin.password = '';
    },
    resetForm(): void {
      this.getDataByVehicleNumProcessing = false;
      this.showTransactionOpts = false;
      this.formData = {
        id: 0,
        vehicle_number: '',
        document_number: '',
        operator: '',
        customer: '',
        product: '',
        send_to: '',
        note: '',
        print_count: 0,
        scaling_1_value: 0,
        scaling_1_type: '',
        scaling_1_datetime: '',
        scaling_2_value: 0,
        scaling_2_type: '',
        scaling_2_datetime: '',
        correction_doc_number: [],
        sync_status: 0,
        sync_datetime: '',
        revision_stat: false,
        created_by: '',
        logs: [],
        created_at: '',
        updated_at: ''
      }
    },
    setDataScale(result: DataScale): void {
      this.dataScale['scale'] = result.scale;
      this.dataScale['status'] = result.status;
      this.dataScale['timestamp'] = result.timestamp;
    },
    handleFormLock (): void {
      if(this.isFormUnlocked) {
        this.isFormUnlocked = false;
        window.electronAPI.setFormLock();
      } else {
        this.onAuthForm = true;
      }
    },

    async unlockingForm(): Promise<void> {
      const errors: string[] = [];
      try {
        this.isSubmitUnlockForm = true;
        const { username, password } = this.formAdmin;
        if(username === '') errors.push('Username tidak boleh kosong');
        if(password === '') errors.push('Password tidak boleh kosong');

        if(errors.length) {
          this.setErrors(true, errors);
          return
        }

        window.electronAPI.validatingUnlockForm(toRaw(this.formAdmin)).then(res => {
          if(res) this.closeAuthModal()
        });
      } catch (e) {
        console.error(e)
      } finally {
        setTimeout(() => this.isSubmitUnlockForm = false, 2000)
      }
    },
    async getNumberPlate(): Promise<void> {
      const errors: string[] = [];
      try {
        const data: string[]|[] = await window.electronAPI.nopolList();
        this.numberPlatesList = data;
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error?.message);
          this.setErrors(true, errors);
        }
      }
    },
    async getOperatorList(): Promise<void> {
      const errors: string[] = [];
      try {
        const data: string[] = await window.electronAPI.operatorList();
        this.operatorsList = data;
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error?.message);
          this.setErrors(true, errors);
        }
      }
    },
    async getProductList(): Promise<void> {
      const errors: string[] = [];
      try {
        const data: string[] = await window.electronAPI.productList();
        this.productsList = data;
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error?.message);
          this.setErrors(true, errors);
        }
      }
    },
    async getCustomerList(): Promise<void> {
      const errors: string[] = [];
      try {
        const data: string[] = await window.electronAPI.customerList();
        this.customersList = data;
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error?.message);
          this.setErrors(true, errors);
        }
      }
    },
    async getDataByVehicleNumber(value: string): Promise<void> {
      const errors: string[] = [];
      const vehicleNumber: string = this.formData.vehicle_number;
      try {
        this.getDataByVehicleNumProcessing = true;
        const result = await window.electronAPI.dataByVehicleNumber(value);
        if(result) {
          this.resetForm();
          // if(this.isFormUnlocked) this.handleFormLock();
          this.formData['vehicle_number'] = vehicleNumber;
          this.formData = {
            id: result.id,
            vehicle_number: result.vehicle_number,
            document_number: result.document_number,
            operator: result.operator,
            customer: result.customer,
            product: result.product,
            send_to: result.send_to,
            note: result.note,
            print_count: result.print_count,
            scaling_1_value: result.scaling_1_value,
            scaling_1_type: result.scaling_1_type,
            scaling_1_datetime: result.scaling_1_datetime,
            scaling_2_value: result.scaling_2_value,
            scaling_2_type: result.scaling_1_type === 'timbang-in' ? 'timbang-out' : 'timbang-in',
            scaling_2_datetime: result.scaling_2_datetime,
            correction_doc_number: result.correction_doc_number,
            sync_status: result.sync_status,
            sync_datetime: result.sync_datetime,
            revision_stat: result.revision_stat,
            created_by: result.created_by,
            logs: result.logs,
            created_at: result.created_at,
            updated_at: result.updated_at
          }
          this.showTransactionOpts = true;
          setTimeout(() => { this.getDataByVehicleNumProcessing = false; }, 3000);
        } else {
          this.resetForm();
          this.formData['vehicle_number'] = vehicleNumber;
          setTimeout(() => {
            this.showTransactionOpts = true;
            this.getDataByVehicleNumProcessing = false;
          }, 1000);
        }
      } catch (error) {
        this.getDataByVehicleNumProcessing = false;
        this.showTransactionOpts = false;
        
        if(error instanceof Error) {
          errors.push(error?.message);
          this.setErrors(true, errors);
        }
      }
    },
    async getScale1(): Promise<void> {
      this.setScale1Status(true);
      try {
        const result = await window.electronAPI.scaleValue();
        if(result.status === 'ST') {
          this.formData.scaling_1_value = result.scale;
          this.formData.scaling_1_datetime = result.timestamp;
          setTimeout(() => this.setScale1Status(), 2000);
        } else {
          this.setNotify(true, 'Data timbangan belum stabil');
          setTimeout(() => this.setScale1Status(), 2000);
        }
        setTimeout(() => this.setScale1Status(), 2000);
      } catch (e) {
        console.error(e)
      }
    },
    async getScale2(): Promise<void> {
      this.setScale2Status(true);
      try {
        const result = await window.electronAPI.scaleValue();
        if(result.status === 'ST') {
          this.formData.scaling_2_value = result.scale;
          this.formData.scaling_2_datetime = result.timestamp;
          setTimeout(() => this.setScale2Status(), 2000);
        } else {
          this.setNotify(true, 'Data timbangan belum stabil');
          setTimeout(() => this.setScale2Status(), 2000);
        }
        setTimeout(() => this.setScale2Status(), 2000);
      } catch (e) {
        console.error(e)
      }
    },
    async processingFormData(): Promise<boolean> {
      // return true;
      const errors: string[] = [];

      try {
        // enable process indicator
        this.isSubmitProcessing = true;

        // validatingform 
        if(this.formData.vehicle_number === '') errors.push('Pilih nomor kendaraan');
        if(this.formData.scaling_1_type === '') errors.push('Pilih jenis transaksi timbang');
        if(this.formData.operator === '') errors.push('Pilih operator kendaraan.');
        if(this.formData.customer === '') errors.push('Customer tidak boleh kosong.');
        if(this.formData.product === '') errors.push('Pilih muatan kendaraan.');
        if(this.formData.scaling_1_value === 0) errors.push('Pastikan nilai skala timbangan (1) terbaca.');
        if(this.formData.send_to === '') errors.push('Masukkan tujuan bongkar');
        if(errors.length) {
          this.setErrors(true, errors);
          return false;
        } else {
          this.formData['created_by'] = this.isFormUnlocked ? 'ADMIN' : 'OPERATOR';
          
          const result = await window.electronAPI.processFormData(toRaw(this.formData));
          if(result) {
            this.setNotify(true, 'Data berhasil ditambahkan');
            this.resetForm();
            return true;
          } else {
            return false;
          }
        }
      } catch (error) {
        if(error instanceof Error) this.setErrors(true, [error?.message]);
        return false
      } finally {
        this.isSubmitProcessing = false;
      }
    },
    async updatingFormData(): Promise<boolean> {
      const errors: string[] = [];

      try {
        this.isSubmitProcessing = true;
        if(this.formData.scaling_1_value === 0) errors.push('Pastikan nilai skala timbangan (2) terbaca.');
        if(errors.length) {
          this.setErrors(true, errors);
          return false;
        } else {
          const result = await window.electronAPI.updatingFormData(this.formData.id, toRaw(this.formData));
          if(result) {
            this.setNotify(true, 'Data berhasil ditambahkan');
            this.resetForm();
            return true;
          } else {
            return false;
          }
        }
      } catch (error) {
        if(error instanceof Error) this.setErrors(true, [error?.message]);
        return false;
      } finally {
        this.isSubmitProcessing = false;
      }
    },
    async getDataList(): Promise<void> {
      await this.getNumberPlate();
      await this.getOperatorList();
      await this.getProductList();
      await this.getCustomerList();
    }
  }
});
