declare module 'pg' {
  import { EventEmitter } from 'events';

  export interface PoolConfig {
    user?: string;
    password?: string;
    host?: string;
    port?: number;
    database?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number;
    command: string;
    fields: FieldInfo[];
  }

  export interface FieldInfo {
    name: string;
    tableID: number;
    columnID: number;
    dataTypeID: number;
    dataTypeSize: number;
    dataTypeModifier: number;
    format: string;
  }

  export interface QueryConfig {
    text: string;
    values?: any[];
    name?: string;
    rowMode?: string;
    types?: any;
  }

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<Client>;
    query<T = any>(queryTextOrConfig: string | QueryConfig, values?: any[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'connect', listener: (client: Client) => void): this;
    on(event: 'acquire', listener: (client: Client) => void): this;
    on(event: 'remove', listener: (client: Client) => void): this;
  }

  export class Client extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<void>;
    query<T = any>(queryTextOrConfig: string | QueryConfig, values?: any[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
    release(): void;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'notification', listener: (message: any) => void): this;
  }
} 