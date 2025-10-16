import { z } from 'zod';

export const MCPMessageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string().optional(),
  params: z.record(z.any()).optional(),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
});
export type MCPMessage = z.infer<typeof MCPMessageSchema>;

export const MCPToolParameterSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string(),
  required: z.boolean().default(false),
  enum: z.array(z.string()).optional(),
  properties: z.record(z.lazy(() => MCPToolParameterSchema)).optional(),
  items: z.lazy(() => MCPToolParameterSchema).optional(),
});
export type MCPToolParameter = z.infer<typeof MCPToolParameterSchema>;

export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.object({
    type: z.literal('object'),
    properties: z.record(MCPToolParameterSchema),
    required: z.array(z.string()).default([]),
    additionalProperties: z.boolean().default(false),
  }),
});
export type MCPTool = z.infer<typeof MCPToolSchema>;

export const MCPResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});
export type MCPResource = z.infer<typeof MCPResourceSchema>;

export const MCPPromptSchema = z.object({
  name: z.string(),
  description: z.string(),
  arguments: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean().default(false),
  })).default([]),
});
export type MCPPrompt = z.infer<typeof MCPPromptSchema>;

export const MCPServerCapabilitiesSchema = z.object({
  tools: z.object({
    listChanged: z.boolean().default(false),
  }).optional(),
  resources: z.object({
    subscribe: z.boolean().default(false),
    listChanged: z.boolean().default(false),
  }).optional(),
  prompts: z.object({
    listChanged: z.boolean().default(false),
  }).optional(),
  logging: z.object({}).optional(),
});
export type MCPServerCapabilities = z.infer<typeof MCPServerCapabilitiesSchema>;

export const MCPClientCapabilitiesSchema = z.object({
  roots: z.object({
    listChanged: z.boolean().default(false),
  }).optional(),
  sampling: z.object({}).optional(),
});
export type MCPClientCapabilities = z.infer<typeof MCPClientCapabilitiesSchema>;

export const MCPInitializeParamsSchema = z.object({
  protocolVersion: z.string(),
  capabilities: MCPClientCapabilitiesSchema,
  clientInfo: z.object({
    name: z.string(),
    version: z.string(),
  }),
});
export type MCPInitializeParams = z.infer<typeof MCPInitializeParamsSchema>;

export const MCPInitializeResultSchema = z.object({
  protocolVersion: z.string(),
  capabilities: MCPServerCapabilitiesSchema,
  serverInfo: z.object({
    name: z.string(),
    version: z.string(),
  }),
  instructions: z.string().optional(),
});
export type MCPInitializeResult = z.infer<typeof MCPInitializeResultSchema>;

export const MCPCallToolParamsSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any()).optional(),
});
export type MCPCallToolParams = z.infer<typeof MCPCallToolParamsSchema>;

export const MCPCallToolResultSchema = z.object({
  content: z.array(z.object({
    type: z.enum(['text', 'image', 'resource']),
    text: z.string().optional(),
    data: z.string().optional(),
    mimeType: z.string().optional(),
    uri: z.string().optional(),
  })),
  isError: z.boolean().default(false),
});
export type MCPCallToolResult = z.infer<typeof MCPCallToolResultSchema>;