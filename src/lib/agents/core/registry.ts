import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import {
  AgentMetadata,
  AgentRegistryEntry,
  AgentMarketplaceFilter,
  AgentPublishRequest,
  AgentInstallRequest,
} from '../../types';

export interface RegistryStorage {
  saveAgent(entry: AgentRegistryEntry): Promise<void>;
  getAgent(agentId: string): Promise<AgentRegistryEntry | null>;
  searchAgents(filter: AgentMarketplaceFilter): Promise<{
    entries: AgentRegistryEntry[];
    total: number;
  }>;
  updateAgent(agentId: string, updates: Partial<AgentRegistryEntry>): Promise<void>;
  deleteAgent(agentId: string): Promise<void>;
  incrementDownloads(agentId: string): Promise<void>;
  addReview(agentId: string, review: AgentRegistryEntry['reviews'][0]): Promise<void>;
}

export class AgentRegistry extends EventEmitter {
  constructor(private storage: RegistryStorage) {
    super();
  }

  async publishAgent(publishRequest: AgentPublishRequest, userId: string): Promise<AgentRegistryEntry> {
    // Validate agent metadata
    await this.validateAgent(publishRequest);

    // Calculate checksum
    const checksum = this.calculateChecksum(publishRequest.code);

    // Create registry entry
    const entry: AgentRegistryEntry = {
      metadata: {
        ...publishRequest.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      code: publishRequest.code,
      manifest: publishRequest.manifest,
      checksum,
      verified: false, // Admin verification required
      publishedAt: new Date(),
      downloadCount: 0,
      rating: 0,
      reviews: [],
    };

    // Save to storage
    await this.storage.saveAgent(entry);

    this.emit('agent_published', entry, userId);

    return entry;
  }

  async updateAgent(
    agentId: string,
    updates: Partial<AgentPublishRequest>,
    userId: string
  ): Promise<AgentRegistryEntry> {
    const existing = await this.storage.getAgent(agentId);
    if (!existing) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Verify ownership (in real implementation, check user permissions)
    if (existing.metadata.author !== userId) {
      throw new Error('Not authorized to update this agent');
    }

    // Create updated entry
    const updatedEntry: AgentRegistryEntry = {
      ...existing,
      ...(updates.metadata && {
        metadata: {
          ...existing.metadata,
          ...updates.metadata,
          updatedAt: new Date(),
        },
      }),
      ...(updates.code && {
        code: updates.code,
        checksum: this.calculateChecksum(updates.code),
      }),
      ...(updates.manifest && { manifest: updates.manifest }),
    };

    // Validate updated agent
    await this.validateAgent({
      metadata: updatedEntry.metadata,
      code: updatedEntry.code,
      manifest: updatedEntry.manifest,
    });

    // Save updated entry
    await this.storage.updateAgent(agentId, updatedEntry);

    this.emit('agent_updated', updatedEntry, userId);

    return updatedEntry;
  }

  async installAgent(installRequest: AgentInstallRequest, userId: string): Promise<AgentRegistryEntry> {
    const agent = await this.storage.getAgent(installRequest.agentId);
    if (!agent) {
      throw new Error(`Agent ${installRequest.agentId} not found`);
    }

    // Increment download count
    await this.storage.incrementDownloads(installRequest.agentId);

    this.emit('agent_installed', agent, userId, installRequest);

    return agent;
  }

  async searchAgents(filter: AgentMarketplaceFilter): Promise<{
    entries: AgentRegistryEntry[];
    total: number;
  }> {
    return await this.storage.searchAgents(filter);
  }

  async getAgent(agentId: string): Promise<AgentRegistryEntry | null> {
    return await this.storage.getAgent(agentId);
  }

  async getAgentsByCategory(category: string): Promise<AgentRegistryEntry[]> {
    const result = await this.storage.searchAgents({
      category,
      limit: 100,
      offset: 0,
    });
    return result.entries;
  }

  async getPopularAgents(limit: number = 20): Promise<AgentRegistryEntry[]> {
    const result = await this.storage.searchAgents({
      sortBy: 'downloadCount',
      sortOrder: 'desc',
      limit,
      offset: 0,
    });
    return result.entries;
  }

  async getTopRatedAgents(limit: number = 20): Promise<AgentRegistryEntry[]> {
    const result = await this.storage.searchAgents({
      sortBy: 'rating',
      sortOrder: 'desc',
      limit,
      offset: 0,
    });
    return result.entries;
  }

  async addReview(
    agentId: string,
    userId: string,
    rating: number,
    comment: string
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const review = {
      userId,
      rating,
      comment,
      createdAt: new Date(),
    };

    await this.storage.addReview(agentId, review);

    // Recalculate average rating
    const agent = await this.storage.getAgent(agentId);
    if (agent) {
      const totalRating = agent.reviews.reduce((sum, r) => sum + r.rating, 0) + rating;
      const averageRating = totalRating / (agent.reviews.length + 1);

      await this.storage.updateAgent(agentId, { rating: averageRating });
    }

    this.emit('review_added', agentId, review);
  }

  async verifyAgent(agentId: string, verified: boolean): Promise<void> {
    await this.storage.updateAgent(agentId, { verified });
    this.emit('agent_verified', agentId, verified);
  }

  async deleteAgent(agentId: string, userId: string): Promise<void> {
    const agent = await this.storage.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Verify ownership (in real implementation, check admin permissions)
    if (agent.metadata.author !== userId) {
      throw new Error('Not authorized to delete this agent');
    }

    await this.storage.deleteAgent(agentId);
    this.emit('agent_deleted', agentId, userId);
  }

  private async validateAgent(publishRequest: Partial<AgentPublishRequest>): Promise<void> {
    if (!publishRequest.metadata) {
      throw new Error('Agent metadata is required');
    }

    if (!publishRequest.code) {
      throw new Error('Agent code is required');
    }

    // Validate metadata
    const metadata = publishRequest.metadata;
    if (!metadata.name || metadata.name.length < 3) {
      throw new Error('Agent name must be at least 3 characters');
    }

    if (!metadata.description || metadata.description.length < 10) {
      throw new Error('Agent description must be at least 10 characters');
    }

    if (!metadata.capabilities || metadata.capabilities.length === 0) {
      throw new Error('Agent must have at least one capability');
    }

    // Validate capabilities
    for (const capability of metadata.capabilities) {
      if (!capability.name || !capability.description) {
        throw new Error('Each capability must have a name and description');
      }
    }

    // Basic code validation
    await this.validateCode(publishRequest.code);
  }

  private async validateCode(code: string): Promise<void> {
    // Basic security checks
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /process\./,
      /require\s*\(/,
      /import\s+/,
      /child_process/,
      /fs\./,
      /\.exec\(/,
      /\.spawn\(/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Code contains potentially dangerous pattern: ${pattern.source}`);
      }
    }

    // Check code length
    if (code.length > 1024 * 1024) { // 1MB limit
      throw new Error('Agent code is too large (max 1MB)');
    }

    // Try to parse as JavaScript (basic syntax check)
    try {
      new Function(code);
    } catch (error) {
      throw new Error(`Code syntax error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateChecksum(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  async getRegistryStats(): Promise<{
    totalAgents: number;
    verifiedAgents: number;
    totalDownloads: number;
    averageRating: number;
    categoriesCount: Record<string, number>;
  }> {
    // This would be implemented by the storage layer
    // For now, return mock data
    return {
      totalAgents: 0,
      verifiedAgents: 0,
      totalDownloads: 0,
      averageRating: 0,
      categoriesCount: {},
    };
  }
}