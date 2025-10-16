import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import * as jsonrpc from 'jsonrpc-lite';
import {
  MCPMessage,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPCallToolParams,
  MCPCallToolResult,
  MCPTool,
  MCPResource,
  MCPPrompt,
} from '../types/mcp';

export interface MCPClientOptions {
  endpoint: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class MCPClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private initialized = false;
  private capabilities: any = {};

  constructor(private options: MCPClientOptions) {
    super();
    this.options.timeout = options.timeout || 30000;
    this.options.retryAttempts = options.retryAttempts || 3;
    this.options.retryDelay = options.retryDelay || 1000;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.endpoint);

        this.ws.on('open', () => {
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('error', (error) => {
          this.emit('error', error);
          reject(error);
        });

        this.ws.on('close', () => {
          this.initialized = false;
          this.emit('disconnected');
          this.rejectAllPendingRequests(new Error('Connection closed'));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.initialized = false;
  }

  async initialize(params: MCPInitializeParams): Promise<MCPInitializeResult> {
    const result = await this.sendRequest('initialize', params);
    this.initialized = true;
    this.capabilities = result.capabilities;
    this.emit('initialized', result);
    return result;
  }

  async listTools(): Promise<MCPTool[]> {
    this.ensureInitialized();
    const result = await this.sendRequest('tools/list');
    return result.tools || [];
  }

  async callTool(params: MCPCallToolParams): Promise<MCPCallToolResult> {
    this.ensureInitialized();
    return await this.sendRequest('tools/call', params);
  }

  async listResources(): Promise<MCPResource[]> {
    this.ensureInitialized();
    const result = await this.sendRequest('resources/list');
    return result.resources || [];
  }

  async readResource(uri: string): Promise<any> {
    this.ensureInitialized();
    return await this.sendRequest('resources/read', { uri });
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    this.ensureInitialized();
    const result = await this.sendRequest('prompts/list');
    return result.prompts || [];
  }

  async getPrompt(name: string, args?: Record<string, any>): Promise<any> {
    this.ensureInitialized();
    return await this.sendRequest('prompts/get', { name, arguments: args });
  }

  async sendNotification(method: string, params?: any): Promise<void> {
    this.ensureConnected();
    const notification = jsonrpc.notification(method, params);
    this.sendMessage(notification);
  }

  private async sendRequest(method: string, params?: any): Promise<any> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request = jsonrpc.request(id, method, params);

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.options.timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.sendMessage(request);
    });
  }

  private sendMessage(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string): void {
    try {
      const parsed = jsonrpc.parse(data);

      if (Array.isArray(parsed)) {
        parsed.forEach(msg => this.processMessage(msg));
      } else {
        this.processMessage(parsed);
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`));
    }
  }

  private processMessage(message: any): void {
    if (message.type === 'success' || message.type === 'error') {
      // Response to a request
      const pending = this.pendingRequests.get(message.payload.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.payload.id);

        if (message.type === 'success') {
          pending.resolve(message.payload.result);
        } else {
          pending.reject(new Error(message.payload.error.message));
        }
      }
    } else if (message.type === 'notification') {
      // Notification from server
      this.emit('notification', message.payload.method, message.payload.params);
    } else if (message.type === 'request') {
      // Request from server (not implemented in this client)
      this.emit('request', message.payload.method, message.payload.params, message.payload.id);
    }
  }

  private ensureConnected(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('MCP client not connected');
    }
  }

  private ensureInitialized(): void {
    this.ensureConnected();
    if (!this.initialized) {
      throw new Error('MCP client not initialized');
    }
  }

  private rejectAllPendingRequests(error: Error): void {
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(error);
    });
    this.pendingRequests.clear();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  get serverCapabilities(): any {
    return this.capabilities;
  }
}