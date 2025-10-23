import { app } from 'electron';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import moment from "moment-timezone";

export class Sqlite {
  private static instance: Sqlite;
  private db!: Database<sqlite3.Database, sqlite3.Statement>;
  
  private constructor() {}

  static getInstance(): Sqlite {
    if(!Sqlite.instance) {
      Sqlite.instance = new Sqlite();
    }

    return Sqlite.instance;
  };

  async init() {
    try {
      const databasePath = path.join(app.isPackaged ? path.dirname(process.execPath) : path.resolve(), 'data-timbangan.sqlite');
      this.db = await open({
        filename: databasePath,
        driver: sqlite3.Database
      });

      await this.db.run(`
        CREATE TABLE IF NOT EXISTS timbangan_kompos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vehicle_number TEXT NOT NULL,
          document_number TEXT NOT NULL,
--           transaction_type TEXT NOT NULL,
          operator TEXT NOT NULL,
          customer TEXT NOT NULL,
          product TEXT NOT NULL,
          send_to TEXT NULL,
          note TEXT NULL,
          print_count INTEGER(3) NOT NULL DEFAULT 0,
          scaling_1_value INTEGER NOT NULL,
          scaling_1_type TEXT NULL,
          scaling_1_datetime TEXT NOT NULL,
          scaling_2_value INTEGER NOT NULL DEFAULT 0,
          scaling_2_type TEXT NULL,
          scaling_2_datetime TEXT NULL,
          correction_doc_number TEXT NULL,
          sync_status INTEGER(1) NULL DEFAULT 0,
          sync_datetime TEXT NULL,
          revision_stat INTEGER(1),
          created_by TEXT NULL,
          logs TEXT NULL,
          created_at TEXT,
          updated_at TEXT
        )
      `);

      await this.db.run(`
        CREATE TABLE IF NOT EXISTS customer_kompos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          _id TEXT NOT NULL UNIQUE,
          customer TEXT NOT NULL
        )
      `);

      await this.db.run(`
        CREATE TABLE IF NOT EXISTS product_kompos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          _id TEXT NOT NULL UNIQUE,
          product TEXT NOT NULL
        )
      `);

      await this.db.run(`
        CREATE TABLE IF NOT EXISTS nopol_kompos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          _id TEXT NOT NULL UNIQUE,
          nopol TEXT NOT NULL,
          weight INTEGER NOT NULL DEFAULT 0
        )
      `);

      await this.db.run(`
        CREATE TABLE IF NOT EXISTS operator_kompos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          _id TEXT NOT NULL UNIQUE,
          operator TEXT NOT NULL
        )
      `);

      await this.db.run(`
        CREATE TABLE IF NOT EXISTS auth_kompos (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            useradmin TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
      `);

      return this.db;
    } catch (error) {
      process.exit(1);
    }
  };

  async getCustomerData(): Promise<CustomerRow[]|[]> {
    try {
      const rows = await this.db.all(`SELECT * FROM customer_kompos`);
      return rows;
    } catch (error) {
      throw error
    }
  };

  async getNopolData(): Promise<NopolRow[]|[]> {
    try {
      const rows = await this.db.all(`SELECT * FROM nopol_kompos`);
      return rows;
    } catch (error) {
      throw error
    }
  };

  async getOperatorData(): Promise<OperatorRow[]|[]> {
    try {
      const rows = await this.db.all(`SELECT * FROM operator_kompos`);
      return rows;
    } catch (error) {
      throw error
    }
  };

  async getProductData(): Promise<ProductRow[]|[]> {
    try {
      const rows = await this.db.all(`SELECT * FROM product_kompos`);
      return rows;
    } catch (error) {
      throw error
    }
  };

  async createDocumentNumber(prefix: 'A-'| 'B-'): Promise<string> {
    try {
      const row: { document_number: string } | undefined = await this.db.get(`
        SELECT document_number FROM timbangan_kompos 
        WHERE document_number LIKE ? || '%' 
        ORDER BY document_number DESC LIMIT 1`, [prefix]
      );

      let startNumber = 1000;
      if(row && row.document_number) {
        const parts = row.document_number.split('-');
        if(parts.length === 2 && !isNaN(Number(parts[1]))) {
          startNumber = Number(parts[1]);
        }
      }
      const newNumber = startNumber +1;
      const documentNumber = `${prefix}${newNumber}`;
      return documentNumber;
    } catch (error) {
      throw error;
    }
  };

  async getAllData(): Promise<ResponseDataTimbangan[]|[]> {
    try {
      const rows = await this.db.all('SELECT * FROM timbangan_kompos');
      return rows;
    } catch (error) {
      throw error
    }
  };

  async dataUnSync(): Promise<ResponseDataTimbangan[]|[]> {
    try {
      return await this.db.all(`
        SELECT * FROM timbangan_kompos
        WHERE sync_status = ?
          AND scaling_1_value <> ? AND LENGTH(scaling_1_type) 
          AND scaling_2_value <> ? AND LENGTH(scaling_2_type)
        ORDER BY created_at ASC
        LIMIT 10`
      , [0, 0, 0]);

    } catch (e) {
      throw e;
    }
  };

  async getDataByVehicleNum(vehicleNum: string): Promise<ResponseDataTimbangan|undefined> {
    let result: ResponseDataTimbangan;
    try {
      const row = await this.db.get(`
        SELECT * FROM timbangan_kompos
        WHERE vehicle_number = ? 
        ORDER BY id DESC
      `, [vehicleNum]);

      result = row;
      if(row) {
        result['correction_doc_number'] = JSON.parse(row.correction_doc_number);
        result['logs'] = JSON.parse(row.logs);
        if(row.scaling_2_type !== '' && row.scaling_2_value !== 0 && row.scaling_1_type !== '') {
          return undefined;
        }
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  async validateUser(username: string, password: string): Promise<{ status: boolean, message: string }> {
    try {
      const row:{ useradmin: string, password: string } | undefined = await this.db.get(`SELECT * FROM auth_kompos WHERE useradmin = ?`, username);
      if(row === undefined) {
        return { status: false, message: 'Username tidak ditemukan'}
      } else {
        const validatingPassword = (password === row.password);
        if(!validatingPassword) { return { status: false, message: 'Username/Password salah'} }
        return { status: true, message: ''};
      }
    } catch (e) {
      throw e;
    }
  };

  async getSingleData(id: number): Promise<ResponseDataTimbangan|undefined> {
    let result: ResponseDataTimbangan;
    try {
      let row = await this.db.get('SELECT * FROM timbangan_kompos WHERE id = ?', id);
      result = row;
      if(row) {
        result['correction_doc_number'] = JSON.parse(row.correction_doc_number);
        result['logs'] = JSON.parse(row.logs);
      };
      return result;
    } catch (error) {
      throw error;
    }
  };

  async createData(formData: DataTimbangan): Promise<ResponseDataTimbangan|undefined> {
    try {
      const docNumber = await this.createDocumentNumber('A-');
      const now = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
      const logs:Log[] = [{
        text: `Dokumen dibuat dengan Timbang 1: ${ formData.scaling_1_type === 'timbang-in' ? 'membawa muatan' : 'tanpa muatan'}`,
        timestamp: now
      }];

      const stringCorrDocNum = JSON.stringify(formData.correction_doc_number);
      const stringLogs = JSON.stringify(logs);

      const insertedData = await this.db.run(`
        INSERT INTO timbangan_kompos (
--           vehicle_number,document_number,transaction_type,operator,customer,product,send_to,note,print_count,scaling_1_value,
          vehicle_number,document_number,operator,customer,product,send_to,note,print_count,scaling_1_value,
          scaling_1_type,scaling_1_datetime,scaling_2_value,scaling_2_type,scaling_2_datetime,correction_doc_number,
          sync_status,sync_datetime,revision_stat,created_by,logs,created_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `,[
        formData.vehicle_number, docNumber, formData.operator, formData.customer, formData.product,
        formData.send_to.toUpperCase(), formData.note.toUpperCase(), formData.print_count, formData.scaling_1_value,
        formData.scaling_1_type, formData.scaling_1_datetime, formData.scaling_2_value, formData.scaling_2_type,
        formData.scaling_2_datetime, stringCorrDocNum, formData.sync_status, formData.sync_datetime, formData.revision_stat,
        formData.created_by, stringLogs, now, now
      ]);

      if(insertedData && insertedData.lastID) {
        return await this.getSingleData(insertedData.lastID);
      }
    } catch (e) {
      throw e;
    }
  };

  async updateData(id: number, formData: DataTimbangan): Promise<ResponseDataTimbangan|undefined> {
    try {
      const now = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
      let logs:Log[] = formData.logs;
      logs = [{
        text: `Dokumen dibuat dengan Timbang 2: ${ formData.scaling_2_type === 'timbang-in' ? 'membawa muatan' : 'tanpa muatan'}`,
        timestamp: now
      },...logs];

      const stringCorrDocNum = JSON.stringify(formData.correction_doc_number);
      const stringLogs = JSON.stringify(logs);
      const printCount = formData.print_count +1;

      const updatedData = await this.db.run(`
        UPDATE timbangan_kompos SET
            note = ?,
            print_count = ?,
            scaling_2_value = ?,
            scaling_2_type = ?,
            scaling_2_datetime = ?,
            correction_doc_number = ?,
            logs = ?,
            updated_at = ?
        WHERE id = ?
      `,[
        formData.note.toUpperCase(), printCount, formData.scaling_2_value, formData.scaling_2_type, formData.scaling_2_datetime,
        stringCorrDocNum, stringLogs, now, id
      ]);

      if(updatedData && (updatedData.changes ?? 0) > 0) {
        return await this.getSingleData(id);
      }
    } catch (e) {
      throw e;
    }
  };

  async deleteData(data: ResponseDataTimbangan): Promise<void> {
    try {
      const id = data.id;
      const now = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

      await this.db.run(`
        UPDATE timbangan_kompos SET sync_status = ?, sync_datetime = ?, updated_at = ?
        WHERE id = ?
      `,[data.sync_status, data.sync_datetime, now, id]
      );
    } catch (e) {
      console.error(e)
    }
  };

  async getNopol(id: number): Promise<NopolRow|undefined> {
    try {
      return await this.db.get(`
        SELECT * FROM nopol_kompos
        WHERE id = ?
      `,[id]
      );
    } catch (e) {
      throw e;
    }
  };

  async getCustomer(id: number): Promise<CustomerRow|undefined> {
    try {
      return await this.db.get(`
        SELECT * FROM customer_kompos
        WHERE id = ?
      `,[id]
      );
    } catch (e) {
      throw e;
    }
  };

  async getProduct(id: number): Promise<ProductRow|undefined> {
    try {
      return await this.db.get(`
        SELECT * FROM product_kompos
        WHERE id = ?
      `,[id]
      );
    } catch (e) {
      throw e;
    }
  };

  async getOperator(id: number): Promise<OperatorRow|undefined> {
    try {
      return await this.db.get(`
        SELECT * FROM operator_kompos
        WHERE id = ?
      `,[id]
      );
    } catch (e) {
      throw e;
    }
  };

  async createOrUpdateNopol(_id:string, vehicle:string, weight:number): Promise<NopolRow|undefined> {
    try {
      const response = await this.db.run(`
        INSERT INTO nopol_kompos (_id, nopol, weight)
        VALUES (?,?,?)
        ON CONFLICT(_id) DO UPDATE SET
          nopol = excluded.nopol,
          weight = excluded.weight
      `,[_id, vehicle, weight]);

      if(response && response.lastID) {
        return await this.getNopol(response.lastID);
      }
    } catch (e) {
      throw e;
    }
  };

  async createOrUpdateProduct(_id:string, product:string): Promise<ProductRow|undefined> {
    try {
      const response = await this.db.run(`
        INSERT INTO product_kompos (_id, product)
        VALUES (?,?)
        ON CONFLICT(_id) DO UPDATE SET
          product = excluded.product
      `,[_id, product]);
      
      if(response && response.lastID) {
        return await this.getProduct(response.lastID);
      }
    } catch (e) {
      throw e;
    }
  };

  async createOrUpdateCustomer(_id:string, customer:string): Promise<CustomerRow|undefined> {
    try {
      const response = await this.db.run(`
        INSERT INTO customer_kompos (_id, customer)
        VALUES (?,?)
        ON CONFLICT(_id) DO UPDATE SET
          customer = excluded.customer
      `,[_id, customer]);
      
      if(response && response.lastID) {
        return await this.getCustomer(response.lastID);
      }
    } catch (e) {
      throw e;
    }
  };

  async createOrUpdateOperator(_id:string, operator:string): Promise<OperatorRow|undefined> {
    try {
      const response = await this.db.run(`
        INSERT INTO operator_kompos (_id, operator)
        VALUES (?,?)
        ON CONFLICT(_id) DO UPDATE SET
          operator = excluded.operator
      `,[_id, operator]);
      
      if(response && response.lastID) {
        return await this.getOperator(response.lastID);
      }
    } catch (e) {
      throw e;
    }
  };
}

export const sqliteService = Sqlite.getInstance();