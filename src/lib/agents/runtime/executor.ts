import ivm from 'isolated-vm';
import { EventEmitter } from 'events';
import {
  AgentExecutionContext,
  AgentExecutionResult,
  SecurityPolicy,
} from '../../types';

export interface ExecutorOptions {
  memoryLimit: number; // MB
  timeLimit: number; // ms
  cpuLimit?: number; // ms
  securityPolicy: SecurityPolicy;
}

export interface ExecutionStats {
  memoryUsed: number;
  cpuTime: number;
  wallTime: number;
  operationsCount: number;
}

export class AgentExecutor extends EventEmitter {
  private isolate: ivm.Isolate;
  private context: ivm.Context;
  private jail: ivm.Reference<object>;

  constructor(private options: ExecutorOptions) {
    super();
  }

  async initialize(): Promise<void> {
    // Create isolate with memory limit
    this.isolate = new ivm.Isolate({
      memoryLimit: this.options.memoryLimit,
    });

    // Create context
    this.context = await this.isolate.createContext();

    // Get global object
    this.jail = this.context.global;

    // Set up basic JavaScript environment
    await this.setupBasicEnvironment();

    // Apply security restrictions
    await this.applySecurityPolicy();

    this.emit('initialized');
  }

  async execute(executionContext: AgentExecutionContext, code: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const logs: AgentExecutionResult['logs'] = [];

    try {
      // Prepare execution environment
      await this.prepareExecution(executionContext);

      // Set up logging
      await this.setupLogging(logs);

      // Create timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Execution timeout'));
        }, this.options.timeLimit);
      });

      // Execute code with timeout
      const executionPromise = this.executeCode(code);
      const result = await Promise.race([executionPromise, timeoutPromise]);

      const endTime = Date.now();
      const stats = await this.getExecutionStats();

      return {
        requestId: executionContext.requestId,
        success: true,
        output: result,
        metadata: {
          executionTime: endTime - startTime,
          memoryUsed: stats.memoryUsed,
          cpuTime: stats.cpuTime,
        },
        logs,
      };
    } catch (error) {
      const endTime = Date.now();
      const stats = await this.getExecutionStats();

      return {
        requestId: executionContext.requestId,
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          executionTime: endTime - startTime,
          memoryUsed: stats.memoryUsed,
          cpuTime: stats.cpuTime,
        },
        logs,
      };
    }
  }

  async cleanup(): Promise<void> {
    if (this.context) {
      this.context.release();
    }
    if (this.isolate) {
      this.isolate.dispose();
    }
    this.emit('cleanup');
  }

  private async setupBasicEnvironment(): Promise<void> {
    // Set up console
    await this.jail.set('console', {
      log: new ivm.Callback((...args: any[]) => {
        this.emit('log', 'info', args.join(' '));
      }),
      error: new ivm.Callback((...args: any[]) => {
        this.emit('log', 'error', args.join(' '));
      }),
      warn: new ivm.Callback((...args: any[]) => {
        this.emit('log', 'warn', args.join(' '));
      }),
      debug: new ivm.Callback((...args: any[]) => {
        this.emit('log', 'debug', args.join(' '));
      }),
    });

    // Set up setTimeout/setInterval (limited)
    await this.jail.set('setTimeout', new ivm.Callback((callback: any, delay: number) => {
      if (delay > this.options.timeLimit) {
        throw new Error('Timeout exceeds execution limit');
      }
      return setTimeout(callback, delay);
    }));

    // Set up basic globals
    await this.jail.set('global', this.jail.derefInto());

    // Add JSON support
    await this.context.eval(`
      global.JSON = {
        parse: JSON.parse,
        stringify: JSON.stringify
      };
    `);

    // Add Promise support
    await this.context.eval(`
      global.Promise = Promise;
    `);
  }

  private async applySecurityPolicy(): Promise<void> {
    const policy = this.options.securityPolicy;

    // Disable dangerous globals
    await this.context.eval(`
      delete global.process;
      delete global.require;
      delete global.module;
      delete global.exports;
      delete global.__dirname;
      delete global.__filename;
      delete global.Buffer;
    `);

    // Set up network restrictions
    if (!policy.allowNetwork) {
      await this.jail.set('fetch', undefined);
      await this.jail.set('XMLHttpRequest', undefined);
    } else {
      // TODO: Implement restricted fetch with domain filtering
      await this.setupRestrictedNetwork();
    }

    // File system restrictions
    if (!policy.allowFileSystem) {
      await this.jail.set('fs', undefined);
    }

    // Child process restrictions
    if (!policy.allowChildProcesses) {
      await this.jail.set('child_process', undefined);
    }
  }

  private async setupRestrictedNetwork(): Promise<void> {
    const allowedDomains = this.options.securityPolicy.allowedDomains;
    const blockedDomains = this.options.securityPolicy.blockedDomains;

    await this.jail.set('fetch', new ivm.Callback(async (url: string, options?: any) => {
      const urlObj = new URL(url);

      // Check blocked domains
      if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
        throw new Error(`Domain ${urlObj.hostname} is blocked`);
      }

      // Check allowed domains (if specified)
      if (allowedDomains.length > 0 && !allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
        throw new Error(`Domain ${urlObj.hostname} is not in allowed list`);
      }

      // Use real fetch (this would be more restricted in production)
      const fetch = (await import('node-fetch')).default;
      return fetch(url, options);
    }));
  }

  private async prepareExecution(executionContext: AgentExecutionContext): Promise<void> {
    // Set up execution context
    await this.jail.set('EXECUTION_CONTEXT', {
      requestId: executionContext.requestId,
      userId: executionContext.userId,
      capability: executionContext.capability,
      input: executionContext.input,
      environment: executionContext.environment,
    });

    // Set up input data
    await this.jail.set('INPUT', executionContext.input);

    // Set up environment variables (filtered)
    const allowedEnvVars = this.options.securityPolicy.allowedEnvironmentVars;
    const filteredEnv: Record<string, string> = {};

    for (const [key, value] of Object.entries(executionContext.environment)) {
      if (allowedEnvVars.includes(key)) {
        filteredEnv[key] = value;
      }
    }

    await this.jail.set('ENV', filteredEnv);
  }

  private async setupLogging(logs: AgentExecutionResult['logs']): Promise<void> {
    this.on('log', (level, message) => {
      logs.push({
        level: level as any,
        message,
        timestamp: new Date(),
      });
    });
  }

  private async executeCode(code: string): Promise<any> {
    // Wrap code in an async function to support async operations
    const wrappedCode = `
      (async function() {
        ${code}
      })();
    `;

    // Execute with CPU limit
    const script = await this.isolate.compileScript(wrappedCode);
    const result = await script.run(this.context, {
      timeout: this.options.timeLimit,
      ...(this.options.cpuLimit && { cpuTimeout: this.options.cpuLimit }),
    });

    return result;
  }

  private async getExecutionStats(): Promise<ExecutionStats> {
    const stats = this.isolate.getHeapStatistics();

    return {
      memoryUsed: stats.used_heap_size / (1024 * 1024), // Convert to MB
      cpuTime: stats.total_heap_size, // This is not accurate, would need better tracking
      wallTime: 0, // Would be calculated by caller
      operationsCount: 0, // Would need to be tracked during execution
    };
  }

  get isRunning(): boolean {
    return !this.isolate.isDisposed;
  }

  get memoryUsage(): number {
    if (!this.isolate || this.isolate.isDisposed) return 0;
    const stats = this.isolate.getHeapStatistics();
    return stats.used_heap_size / (1024 * 1024); // MB
  }
}