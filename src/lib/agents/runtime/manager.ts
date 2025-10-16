import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentExecutor, ExecutorOptions } from './executor';
import {
  AgentInstance,
  AgentExecutionContext,
  AgentExecutionResult,
  SecurityPolicy,
  AgentMetadata,
} from '../../types';

export interface RuntimeManagerOptions {
  maxConcurrentExecutions: number;
  defaultTimeLimit: number;
  defaultMemoryLimit: number;
  defaultSecurityPolicy: SecurityPolicy;
}

export interface ExecutionRequest {
  instanceId: string;
  capability: string;
  input: Record<string, any>;
  userId: string;
  environment?: Record<string, string>;
  overrides?: Partial<ExecutorOptions>;
}

export class RuntimeManager extends EventEmitter {
  private activeExecutions = new Map<string, {
    executor: AgentExecutor;
    context: AgentExecutionContext;
    startTime: number;
  }>();
  private instances = new Map<string, AgentInstance>();
  private executionQueue: Array<{
    request: ExecutionRequest;
    resolve: (result: AgentExecutionResult) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(private options: RuntimeManagerOptions) {
    super();
    this.startQueueProcessor();
  }

  async createInstance(
    metadata: AgentMetadata,
    userId: string,
    config: Record<string, any> = {},
    environment: Record<string, string> = {}
  ): Promise<AgentInstance> {
    const instanceId = uuidv4();
    const now = new Date();

    const instance: AgentInstance = {
      id: instanceId,
      agentId: metadata.id,
      userId,
      status: 'idle',
      metadata,
      config,
      environment,
      resources: {
        memoryUsed: 0,
        cpuUsed: 0,
        networkUsed: 0,
      },
      createdAt: now,
      lastActiveAt: now,
    };

    this.instances.set(instanceId, instance);
    this.emit('instance_created', instance);

    return instance;
  }

  async deleteInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    // Terminate any active executions
    await this.terminateExecution(instanceId);

    // Remove from instances
    this.instances.delete(instanceId);

    // Update instance status
    instance.status = 'terminated';
    instance.terminatedAt = new Date();

    this.emit('instance_deleted', instance);
  }

  async executeCapability(request: ExecutionRequest): Promise<AgentExecutionResult> {
    const instance = this.instances.get(request.instanceId);
    if (!instance) {
      throw new Error(`Instance ${request.instanceId} not found`);
    }

    // Check if capability exists
    const capability = instance.metadata.capabilities.find(c => c.name === request.capability);
    if (!capability) {
      throw new Error(`Capability ${request.capability} not found in agent ${instance.agentId}`);
    }

    // Check concurrent execution limit
    if (this.activeExecutions.size >= this.options.maxConcurrentExecutions) {
      return new Promise((resolve, reject) => {
        this.executionQueue.push({ request, resolve, reject });
        this.emit('execution_queued', request);
      });
    }

    return this.performExecution(request);
  }

  async terminateExecution(instanceId: string): Promise<void> {
    const execution = Array.from(this.activeExecutions.entries())
      .find(([_, exec]) => exec.context.instanceId === instanceId);

    if (execution) {
      const [requestId, exec] = execution;
      await exec.executor.cleanup();
      this.activeExecutions.delete(requestId);
      this.emit('execution_terminated', requestId);
    }
  }

  private async performExecution(request: ExecutionRequest): Promise<AgentExecutionResult> {
    const instance = this.instances.get(request.instanceId)!;
    const requestId = uuidv4();

    // Create execution context
    const context: AgentExecutionContext = {
      instanceId: request.instanceId,
      requestId,
      userId: request.userId,
      capability: request.capability,
      input: request.input,
      environment: { ...instance.environment, ...request.environment },
      startTime: new Date(),
      timeoutAt: new Date(Date.now() + (request.overrides?.timeLimit || instance.metadata.timeoutLimit)),
    };

    // Create executor options
    const executorOptions: ExecutorOptions = {
      memoryLimit: request.overrides?.memoryLimit || instance.metadata.memoryLimit,
      timeLimit: request.overrides?.timeLimit || instance.metadata.timeoutLimit,
      securityPolicy: request.overrides?.securityPolicy || this.options.defaultSecurityPolicy,
    };

    // Create and initialize executor
    const executor = new AgentExecutor(executorOptions);
    await executor.initialize();

    // Track execution
    this.activeExecutions.set(requestId, {
      executor,
      context,
      startTime: Date.now(),
    });

    // Update instance status
    instance.status = 'running';
    instance.lastActiveAt = new Date();

    this.emit('execution_started', context);

    try {
      // Get agent code (in real implementation, this would be retrieved from storage)
      const agentCode = await this.getAgentCode(instance.agentId);

      // Execute
      const result = await executor.execute(context, agentCode);

      // Update instance resources
      instance.resources = {
        memoryUsed: executor.memoryUsage,
        cpuUsed: result.metadata.cpuTime,
        networkUsed: 0, // Would be tracked during execution
      };

      // Update instance status
      instance.status = this.activeExecutions.size > 1 ? 'running' : 'idle';
      instance.lastActiveAt = new Date();

      this.emit('execution_completed', result);

      return result;
    } catch (error) {
      const result: AgentExecutionResult = {
        requestId,
        success: false,
        error: {
          code: 'RUNTIME_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          executionTime: Date.now() - this.activeExecutions.get(requestId)!.startTime,
          memoryUsed: executor.memoryUsage,
          cpuTime: 0,
        },
        logs: [],
      };

      // Update instance status
      instance.status = 'error';
      instance.lastActiveAt = new Date();

      this.emit('execution_failed', result);

      return result;
    } finally {
      // Cleanup
      await executor.cleanup();
      this.activeExecutions.delete(requestId);
    }
  }

  private async getAgentCode(agentId: string): Promise<string> {
    // In a real implementation, this would retrieve the agent code from storage
    // For now, return a simple example
    return `
      // Agent execution code would be loaded here
      const result = {
        message: "Hello from agent " + EXECUTION_CONTEXT.agentId,
        input: INPUT,
        timestamp: new Date().toISOString()
      };

      return result;
    `;
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.executionQueue.length > 0 && this.activeExecutions.size < this.options.maxConcurrentExecutions) {
        const item = this.executionQueue.shift();
        if (item) {
          try {
            const result = await this.performExecution(item.request);
            item.resolve(result);
          } catch (error) {
            item.reject(error instanceof Error ? error : new Error('Unknown error'));
          }
        }
      }
    }, 100); // Check every 100ms
  }

  getInstance(instanceId: string): AgentInstance | undefined {
    return this.instances.get(instanceId);
  }

  getInstancesByUser(userId: string): AgentInstance[] {
    return Array.from(this.instances.values()).filter(i => i.userId === userId);
  }

  getActiveExecutions(): Array<{
    requestId: string;
    context: AgentExecutionContext;
    startTime: number;
  }> {
    return Array.from(this.activeExecutions.entries()).map(([requestId, exec]) => ({
      requestId,
      context: exec.context,
      startTime: exec.startTime,
    }));
  }

  getStats() {
    return {
      totalInstances: this.instances.size,
      activeExecutions: this.activeExecutions.size,
      queuedExecutions: this.executionQueue.length,
      instancesByStatus: {
        idle: Array.from(this.instances.values()).filter(i => i.status === 'idle').length,
        running: Array.from(this.instances.values()).filter(i => i.status === 'running').length,
        paused: Array.from(this.instances.values()).filter(i => i.status === 'paused').length,
        error: Array.from(this.instances.values()).filter(i => i.status === 'error').length,
        terminated: Array.from(this.instances.values()).filter(i => i.status === 'terminated').length,
      },
    };
  }
}