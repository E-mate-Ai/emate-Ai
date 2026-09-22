import type { Tool, ToolExecutionResult } from './types';
import { retrievalTool } from './retrievalTool';
import { summarizerTool } from './summarizerTool';
import { quizGenTool } from './quizGenTool';
import { citationFormatterTool } from './citationFormatterTool';

/**
 * Tool Registry
 * Manages registration, lookup, and unified invocation of all agentic tools.
 */
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.register(retrievalTool);
    this.register(summarizerTool);
    this.register(quizGenTool);
    this.register(citationFormatterTool);
  }

  /** Register a new tool */
  public register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /** Retrieve a tool by name */
  public get<TInput = any, TOutput = any>(name: string): Tool<TInput, TOutput> | undefined {
    return this.tools.get(name) as Tool<TInput, TOutput> | undefined;
  }

  /** Check if a tool exists */
  public has(name: string): boolean {
    return this.tools.has(name);
  }

  /** List all registered tools and their metadata */
  public list(): Array<{ name: string; description: string; inputSchema?: any }> {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }

  /** Execute a registered tool by name with error handling & telemetry */
  public async execute<TInput = any, TOutput = any>(
    name: string,
    input: TInput
  ): Promise<ToolExecutionResult<TOutput>> {
    const tool = this.get<TInput, TOutput>(name);
    const start = Date.now();

    if (!tool) {
      return {
        toolName: name,
        success: false,
        error: `Tool "${name}" is not registered in the tool registry.`,
        executionTimeMs: Date.now() - start,
      };
    }

    try {
      const data = await tool.execute(input);
      return {
        toolName: name,
        success: true,
        data,
        executionTimeMs: Date.now() - start,
      };
    } catch (err: any) {
      console.error(`[ToolRegistry] Error executing tool "${name}":`, err);
      return {
        toolName: name,
        success: false,
        error: err.message || String(err),
        executionTimeMs: Date.now() - start,
      };
    }
  }
}

/** Singleton instance of the ToolRegistry */
export const toolRegistry = new ToolRegistry();
