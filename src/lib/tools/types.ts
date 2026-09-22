/**
 * e-Mate AI — Standardized Tool-Calling Layer
 * Defines interfaces, metadata schemas, and execution contracts for discrete agentic tools.
 */

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    items?: Record<string, unknown>;
  }>;
  required?: string[];
}

export interface Tool<TInput = any, TOutput = any> {
  /** Unique snake_case name of the tool (e.g. 'retrieval_tool') */
  name: string;
  /** Human & LLM-readable description of what the tool accomplishes */
  description: string;
  /** Parameter schema defining valid inputs */
  inputSchema?: ToolInputSchema;
  /** Execution logic for the tool */
  execute: (input: TInput) => Promise<TOutput>;
}

export interface ToolExecutionResult<T = any> {
  toolName: string;
  success: boolean;
  data?: T;
  error?: string;
  executionTimeMs: number;
}
