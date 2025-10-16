import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import * as jsonrpc from 'jsonrpc-lite';
import {
  MCPMessage,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPServerCapabilities,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPCallToolParams,
  MCPCallToolResult,
} from '../types/mcp';

export interface MCPServerOptions {
  port: number;
  name: string;
  version: string;
  capabilities?: MCPServerCapabilities;
}

export interface MCPToolHandler {
  (params: MCPCallToolParams, context: { clientId: string }): Promise<MCPCallToolResult>;
}

export interface MCPResourceHandler {
  (uri: string, context: { clientId: string }): Promise<any>;
}

export interface MCPPromptHandler {
  (name: string, args: Record<string, any>, context: { clientId: string }): Promise<any>;
}

export class MCPServer extends EventEmitter {
  private wss: WebSocketServer;
  private clients = new Map<string, {
    ws: WebSocket;
    initialized: boolean;
    info?: any;
  }>();
  private tools = new Map<string, { definition: MCPTool; handler: MCPToolHandler }>();
  private resources = new Map<string, { definition: MCPResource; handler: MCPResourceHandler }>();
  private prompts = new Map<string, { definition: MCPPrompt; handler: MCPPromptHandler }>();

  constructor(private options: MCPServerOptions) {
    super();
    this.options.capabilities = options.capabilities || {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false },
      logging: {},
    };

    this.wss = new WebSocketServer({ port: options.port });
    this.setupServer();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();

      this.clients.set(clientId, {
        ws,
        initialized: false,
      });

      this.emit('client_connected', clientId);

      ws.on('message', (data) => {
        this.handleMessage(clientId, data.toString());
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.emit('client_disconnected', clientId);
      });

      ws.on('error', (error) => {
        this.emit('client_error', clientId, error);
      });
    });

    this.wss.on('error', (error) => {
      this.emit('error', error);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.once('listening', () => {
        this.emit('started', this.options.port);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.emit('stopped');
        resolve();
      });
    });
  }

  addTool(definition: MCPTool, handler: MCPToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
    this.notifyToolsChanged();
  }

  removeTool(name: string): void {
    this.tools.delete(name);
    this.notifyToolsChanged();
  }

  addResource(definition: MCPResource, handler: MCPResourceHandler): void {
    this.resources.set(definition.uri, { definition, handler });
    this.notifyResourcesChanged();
  }

  removeResource(uri: string): void {
    this.resources.delete(uri);
    this.notifyResourcesChanged();
  }

  addPrompt(definition: MCPPrompt, handler: MCPPromptHandler): void {
    this.prompts.set(definition.name, { definition, handler });
    this.notifyPromptsChanged();
  }

  removePrompt(name: string): void {
    this.prompts.delete(name);
    this.notifyPromptsChanged();
  }

  private handleMessage(clientId: string, data: string): void {
    try {
      const parsed = jsonrpc.parse(data);

      if (Array.isArray(parsed)) {
        parsed.forEach(msg => this.processMessage(clientId, msg));
      } else {
        this.processMessage(clientId, parsed);
      }
    } catch (error) {
      this.sendError(clientId, null, -32700, 'Parse error', error);
    }
  }

  private async processMessage(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      if (message.type === 'request') {
        await this.handleRequest(clientId, message.payload);
      } else if (message.type === 'notification') {
        await this.handleNotification(clientId, message.payload);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      if (message.type === 'request') {
        this.sendError(clientId, message.payload.id, -32603, 'Internal error', error);
      }
    }
  }

  private async handleRequest(clientId: string, request: any): Promise<void> {
    const { method, params, id } = request;
    const client = this.clients.get(clientId)!;

    switch (method) {
      case 'initialize':
        const initResult: MCPInitializeResult = {
          protocolVersion: '2024-11-05',
          capabilities: this.options.capabilities!,
          serverInfo: {
            name: this.options.name,
            version: this.options.version,
          },
        };
        client.initialized = true;
        client.info = params.clientInfo;
        this.sendResponse(clientId, id, initResult);
        this.emit('client_initialized', clientId, params);
        break;

      case 'tools/list':
        this.ensureInitialized(clientId);
        const tools = Array.from(this.tools.values()).map(t => t.definition);
        this.sendResponse(clientId, id, { tools });
        break;

      case 'tools/call':
        this.ensureInitialized(clientId);
        await this.handleToolCall(clientId, id, params);
        break;

      case 'resources/list':
        this.ensureInitialized(clientId);
        const resources = Array.from(this.resources.values()).map(r => r.definition);
        this.sendResponse(clientId, id, { resources });
        break;

      case 'resources/read':
        this.ensureInitialized(clientId);
        await this.handleResourceRead(clientId, id, params);
        break;

      case 'prompts/list':
        this.ensureInitialized(clientId);
        const prompts = Array.from(this.prompts.values()).map(p => p.definition);
        this.sendResponse(clientId, id, { prompts });
        break;

      case 'prompts/get':
        this.ensureInitialized(clientId);
        await this.handlePromptGet(clientId, id, params);
        break;

      default:
        this.sendError(clientId, id, -32601, 'Method not found');
    }
  }

  private async handleNotification(clientId: string, notification: any): Promise<void> {
    // Handle notifications from client
    this.emit('notification', clientId, notification.method, notification.params);
  }

  private async handleToolCall(clientId: string, requestId: string | number, params: MCPCallToolParams): Promise<void> {
    const tool = this.tools.get(params.name);
    if (!tool) {
      this.sendError(clientId, requestId, -32602, `Tool not found: ${params.name}`);
      return;
    }

    try {
      const result = await tool.handler(params, { clientId });
      this.sendResponse(clientId, requestId, result);
    } catch (error) {
      this.sendError(clientId, requestId, -32603, 'Tool execution failed', error);
    }
  }

  private async handleResourceRead(clientId: string, requestId: string | number, params: { uri: string }): Promise<void> {
    const resource = this.resources.get(params.uri);
    if (!resource) {
      this.sendError(clientId, requestId, -32602, `Resource not found: ${params.uri}`);
      return;
    }

    try {
      const result = await resource.handler(params.uri, { clientId });
      this.sendResponse(clientId, requestId, result);
    } catch (error) {
      this.sendError(clientId, requestId, -32603, 'Resource read failed', error);
    }
  }

  private async handlePromptGet(clientId: string, requestId: string | number, params: { name: string; arguments?: Record<string, any> }): Promise<void> {
    const prompt = this.prompts.get(params.name);
    if (!prompt) {
      this.sendError(clientId, requestId, -32602, `Prompt not found: ${params.name}`);
      return;
    }

    try {
      const result = await prompt.handler(params.name, params.arguments || {}, { clientId });
      this.sendResponse(clientId, requestId, result);
    } catch (error) {
      this.sendError(clientId, requestId, -32603, 'Prompt execution failed', error);
    }
  }

  private ensureInitialized(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client?.initialized) {
      throw new Error('Client not initialized');
    }
  }

  private sendResponse(clientId: string, id: string | number, result: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const response = jsonrpc.success(id, result);
    client.ws.send(JSON.stringify(response));
  }

  private sendError(clientId: string, id: string | number | null, code: number, message: string, data?: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const error = jsonrpc.error(id, { code, message, data });
    client.ws.send(JSON.stringify(error));
  }

  private sendNotification(clientId: string, method: string, params?: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const notification = jsonrpc.notification(method, params);
    client.ws.send(JSON.stringify(notification));
  }

  private notifyToolsChanged(): void {
    if (this.options.capabilities?.tools?.listChanged) {
      this.broadcastNotification('notifications/tools/list_changed');
    }
  }

  private notifyResourcesChanged(): void {
    if (this.options.capabilities?.resources?.listChanged) {
      this.broadcastNotification('notifications/resources/list_changed');
    }
  }

  private notifyPromptsChanged(): void {
    if (this.options.capabilities?.prompts?.listChanged) {
      this.broadcastNotification('notifications/prompts/list_changed');
    }
  }

  private broadcastNotification(method: string, params?: any): void {
    this.clients.forEach((client, clientId) => {
      if (client.initialized) {
        this.sendNotification(clientId, method, params);
      }
    });
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  get connectedClients(): number {
    return this.clients.size;
  }

  get initializedClients(): number {
    return Array.from(this.clients.values()).filter(c => c.initialized).length;
  }
}