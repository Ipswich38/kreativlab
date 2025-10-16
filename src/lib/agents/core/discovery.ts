import { EventEmitter } from 'events';
import {
  AgentRegistryEntry,
  AgentCapability,
  AgentMarketplaceFilter,
} from '../../types';

export interface SearchResult {
  agents: AgentRegistryEntry[];
  total: number;
  facets: {
    categories: Record<string, number>;
    tags: Record<string, number>;
    authors: Record<string, number>;
    ratings: Record<string, number>;
  };
}

export interface RecommendationContext {
  userId: string;
  userAgents: string[];
  recentActivity: string[];
  preferences: {
    categories: string[];
    tags: string[];
  };
}

export class AgentDiscoveryService extends EventEmitter {
  private searchIndex = new Map<string, Set<string>>();
  private categoryIndex = new Map<string, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  private capabilityIndex = new Map<string, Set<string>>();

  constructor(private getAgents: () => Promise<AgentRegistryEntry[]>) {
    super();
    this.buildSearchIndex();
  }

  async search(query: string, filter?: Partial<AgentMarketplaceFilter>): Promise<SearchResult> {
    const allAgents = await this.getAgents();
    let results = allAgents;

    // Apply text search
    if (query) {
      const searchTerms = this.tokenize(query.toLowerCase());
      results = results.filter(agent =>
        this.matchesSearch(agent, searchTerms)
      );
    }

    // Apply filters
    if (filter?.category) {
      results = results.filter(agent => agent.metadata.category === filter.category);
    }

    if (filter?.tags && filter.tags.length > 0) {
      results = results.filter(agent =>
        filter.tags!.some(tag => agent.metadata.tags.includes(tag))
      );
    }

    if (filter?.verified !== undefined) {
      results = results.filter(agent => agent.verified === filter.verified);
    }

    if (filter?.rating && filter.rating > 0) {
      results = results.filter(agent => agent.rating >= filter.rating!);
    }

    if (filter?.author) {
      results = results.filter(agent => agent.metadata.author === filter.author);
    }

    // Apply sorting
    const sortBy = filter?.sortBy || 'createdAt';
    const sortOrder = filter?.sortOrder || 'desc';

    results.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.metadata.name.toLowerCase();
          bValue = b.metadata.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'downloadCount':
          aValue = a.downloadCount;
          bValue = b.downloadCount;
          break;
        case 'updatedAt':
          aValue = a.metadata.updatedAt.getTime();
          bValue = b.metadata.updatedAt.getTime();
          break;
        case 'createdAt':
        default:
          aValue = a.metadata.createdAt.getTime();
          bValue = b.metadata.createdAt.getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 20;
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    // Generate facets
    const facets = this.generateFacets(results);

    return {
      agents: paginatedResults,
      total,
      facets,
    };
  }

  async findSimilarAgents(agentId: string, limit: number = 5): Promise<AgentRegistryEntry[]> {
    const allAgents = await this.getAgents();
    const targetAgent = allAgents.find(a => a.metadata.id === agentId);

    if (!targetAgent) {
      return [];
    }

    // Calculate similarity scores
    const similarities = allAgents
      .filter(agent => agent.metadata.id !== agentId)
      .map(agent => ({
        agent,
        score: this.calculateSimilarity(targetAgent, agent),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return similarities.map(s => s.agent);
  }

  async findByCapability(capability: string): Promise<AgentRegistryEntry[]> {
    const allAgents = await this.getAgents();
    return allAgents.filter(agent =>
      agent.metadata.capabilities.some(cap =>
        cap.name.toLowerCase().includes(capability.toLowerCase()) ||
        cap.description.toLowerCase().includes(capability.toLowerCase())
      )
    );
  }

  async getRecommendations(context: RecommendationContext, limit: number = 10): Promise<AgentRegistryEntry[]> {
    const allAgents = await this.getAgents();

    // Score agents based on recommendation context
    const scoredAgents = allAgents
      .filter(agent => !context.userAgents.includes(agent.metadata.id))
      .map(agent => ({
        agent,
        score: this.calculateRecommendationScore(agent, context),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredAgents.map(s => s.agent);
  }

  async getTrendingAgents(timeframe: 'day' | 'week' | 'month' = 'week', limit: number = 20): Promise<AgentRegistryEntry[]> {
    const allAgents = await this.getAgents();

    // Calculate trending score based on recent downloads and ratings
    const now = new Date();
    const timeframeMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const trendingAgents = allAgents
      .map(agent => ({
        agent,
        score: this.calculateTrendingScore(agent, timeframeMs),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return trendingAgents.map(t => t.agent);
  }

  async getAgentsByTags(tags: string[]): Promise<AgentRegistryEntry[]> {
    const allAgents = await this.getAgents();
    return allAgents.filter(agent =>
      tags.some(tag => agent.metadata.tags.includes(tag))
    );
  }

  async getCategories(): Promise<Array<{ name: string; count: number }>> {
    const allAgents = await this.getAgents();
    const categoryCount = new Map<string, number>();

    allAgents.forEach(agent => {
      const category = agent.metadata.category;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    return Array.from(categoryCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getTags(): Promise<Array<{ name: string; count: number }>> {
    const allAgents = await this.getAgents();
    const tagCount = new Map<string, number>();

    allAgents.forEach(agent => {
      agent.metadata.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  private async buildSearchIndex(): Promise<void> {
    const agents = await this.getAgents();

    this.searchIndex.clear();
    this.categoryIndex.clear();
    this.tagIndex.clear();
    this.capabilityIndex.clear();

    agents.forEach(agent => {
      const agentId = agent.metadata.id;

      // Build text search index
      const searchableText = [
        agent.metadata.name,
        agent.metadata.description,
        ...agent.metadata.tags,
        ...agent.metadata.capabilities.map(c => c.name),
        ...agent.metadata.capabilities.map(c => c.description),
      ].join(' ').toLowerCase();

      const tokens = this.tokenize(searchableText);
      tokens.forEach(token => {
        if (!this.searchIndex.has(token)) {
          this.searchIndex.set(token, new Set());
        }
        this.searchIndex.get(token)!.add(agentId);
      });

      // Build category index
      const category = agent.metadata.category;
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, new Set());
      }
      this.categoryIndex.get(category)!.add(agentId);

      // Build tag index
      agent.metadata.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(agentId);
      });

      // Build capability index
      agent.metadata.capabilities.forEach(cap => {
        if (!this.capabilityIndex.has(cap.name)) {
          this.capabilityIndex.set(cap.name, new Set());
        }
        this.capabilityIndex.get(cap.name)!.add(agentId);
      });
    });
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  private matchesSearch(agent: AgentRegistryEntry, searchTerms: string[]): boolean {
    const agentText = [
      agent.metadata.name,
      agent.metadata.description,
      ...agent.metadata.tags,
      ...agent.metadata.capabilities.map(c => c.name),
      ...agent.metadata.capabilities.map(c => c.description),
    ].join(' ').toLowerCase();

    return searchTerms.every(term =>
      agentText.includes(term)
    );
  }

  private calculateSimilarity(agent1: AgentRegistryEntry, agent2: AgentRegistryEntry): number {
    let score = 0;

    // Category similarity
    if (agent1.metadata.category === agent2.metadata.category) {
      score += 0.3;
    }

    // Tag similarity
    const commonTags = agent1.metadata.tags.filter(tag =>
      agent2.metadata.tags.includes(tag)
    ).length;
    const totalTags = new Set([...agent1.metadata.tags, ...agent2.metadata.tags]).size;
    if (totalTags > 0) {
      score += (commonTags / totalTags) * 0.4;
    }

    // Capability similarity
    const commonCapabilities = agent1.metadata.capabilities.filter(cap1 =>
      agent2.metadata.capabilities.some(cap2 => cap1.category === cap2.category)
    ).length;
    const totalCapabilities = agent1.metadata.capabilities.length + agent2.metadata.capabilities.length;
    if (totalCapabilities > 0) {
      score += (commonCapabilities / totalCapabilities) * 0.3;
    }

    return score;
  }

  private calculateRecommendationScore(agent: AgentRegistryEntry, context: RecommendationContext): number {
    let score = 0;

    // Category preference
    if (context.preferences.categories.includes(agent.metadata.category)) {
      score += 0.3;
    }

    // Tag preference
    const matchingTags = agent.metadata.tags.filter(tag =>
      context.preferences.tags.includes(tag)
    ).length;
    score += (matchingTags / Math.max(agent.metadata.tags.length, 1)) * 0.2;

    // Rating boost
    score += (agent.rating / 5) * 0.2;

    // Popularity boost
    score += Math.min(agent.downloadCount / 1000, 1) * 0.1;

    // Verified agent boost
    if (agent.verified) {
      score += 0.1;
    }

    // Recency boost
    const daysSincePublished = (Date.now() - agent.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 30) {
      score += 0.1 * (1 - daysSincePublished / 30);
    }

    return score;
  }

  private calculateTrendingScore(agent: AgentRegistryEntry, timeframeMs: number): number {
    const now = Date.now();
    const agentAge = now - agent.publishedAt.getTime();

    // Base score from rating and downloads
    let score = agent.rating * 0.3 + Math.min(agent.downloadCount / 100, 10) * 0.1;

    // Recency boost
    if (agentAge < timeframeMs) {
      score += (1 - agentAge / timeframeMs) * 0.6;
    }

    // Recent reviews boost (mock implementation)
    const recentReviews = agent.reviews.filter(
      review => now - review.createdAt.getTime() < timeframeMs
    ).length;
    score += Math.min(recentReviews / 10, 1) * 0.2;

    return score;
  }

  private generateFacets(agents: AgentRegistryEntry[]): SearchResult['facets'] {
    const facets = {
      categories: {} as Record<string, number>,
      tags: {} as Record<string, number>,
      authors: {} as Record<string, number>,
      ratings: {} as Record<string, number>,
    };

    agents.forEach(agent => {
      // Categories
      facets.categories[agent.metadata.category] =
        (facets.categories[agent.metadata.category] || 0) + 1;

      // Tags
      agent.metadata.tags.forEach(tag => {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      });

      // Authors
      facets.authors[agent.metadata.author] =
        (facets.authors[agent.metadata.author] || 0) + 1;

      // Ratings
      const ratingBucket = Math.floor(agent.rating).toString();
      facets.ratings[ratingBucket] =
        (facets.ratings[ratingBucket] || 0) + 1;
    });

    return facets;
  }
}