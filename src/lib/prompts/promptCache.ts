import crypto from 'crypto';
import { estimateTokenCount, type RetrievedChunk } from './index';

/**
 * e-Mate AI — Prompt & Context Caching Engine
 * Implements deterministic prompt fingerprinting, session-aware cache invalidation,
 * provider-native cache_control breakpoints (OpenRouter / Anthropic / Gemini), and dev telemetry.
 */

export interface PromptCacheEvaluation {
  isHit: boolean;
  fingerprint: string;
  shortKey: string;
  reason: 'exact_session_match' | 'global_prefix_match' | 'context_changed' | 'new_session' | 'empty_context';
  estimatedTokens: number;
  tokensSaved: number;
}

export interface CachedSystemBlock {
  type: 'text';
  text: string;
  cache_control?: {
    type: 'ephemeral';
  };
}

interface CacheEntry {
  fingerprint: string;
  tokenEstimate: number;
  lastUsedAt: number;
  hitCount: number;
}

/**
 * In-memory LRU prompt cache registry.
 * Tracks session fingerprints and detects cache hits/misses for telemetry and token savings.
 */
class PromptCacheTracker {
  private sessionMap = new Map<string, CacheEntry>();
  private globalMap = new Map<string, number>(); // fingerprint -> hitCount
  private maxEntries = 200;
  private totalHits = 0;
  private totalMisses = 0;
  private totalTokensSaved = 0;

  /**
   * Generates a deterministic SHA-256 fingerprint for the static prompt components.
   */
  public generateFingerprint(params: {
    systemPrompt: string;
    subject?: string;
    unit?: string;
    mode?: string;
    chunks?: RetrievedChunk[];
    notebookContext?: string;
  }): { fingerprint: string; tokenEstimate: number } {
    const { systemPrompt, subject = '', unit = '', mode = '', chunks = [], notebookContext = '' } = params;

    // Build canonical serialized representation of static instructional and context components
    const canonicalPayload = JSON.stringify({
      systemPrompt,
      scope: `${subject}::${unit}::${mode}`,
      chunks: chunks.map((c) => ({
        id: String(c.id),
        source: c.source,
        text: c.text,
      })),
      notebook: notebookContext.trim(),
    });

    const hash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');
    const tokenEstimate = estimateTokenCount(systemPrompt);

    return { fingerprint: hash, tokenEstimate };
  }

  /**
   * Evaluates whether the current request is a prompt cache hit or miss.
   */
  public evaluate(
    sessionKey: string,
    params: {
      systemPrompt: string;
      subject?: string;
      unit?: string;
      mode?: string;
      chunks?: RetrievedChunk[];
      notebookContext?: string;
    }
  ): PromptCacheEvaluation {
    const { fingerprint, tokenEstimate } = this.generateFingerprint(params);
    const shortKey = fingerprint.slice(0, 8);
    const now = Date.now();

    const existingSession = this.sessionMap.get(sessionKey);
    let isHit = false;
    let reason: PromptCacheEvaluation['reason'] = 'new_session';
    let tokensSaved = 0;

    if (!params.systemPrompt.trim()) {
      reason = 'empty_context';
    } else if (existingSession && existingSession.fingerprint === fingerprint) {
      // Exact hit: same session with identical system prompt & context
      isHit = true;
      reason = 'exact_session_match';
      tokensSaved = tokenEstimate;
      existingSession.hitCount += 1;
      existingSession.lastUsedAt = now;
      this.totalHits += 1;
      this.totalTokensSaved += tokensSaved;
    } else if (this.globalMap.has(fingerprint)) {
      // Global prefix match across different sessions
      isHit = true;
      reason = 'global_prefix_match';
      tokensSaved = tokenEstimate;
      this.globalMap.set(fingerprint, (this.globalMap.get(fingerprint) || 0) + 1);
      this.totalHits += 1;
      this.totalTokensSaved += tokensSaved;

      this.sessionMap.set(sessionKey, {
        fingerprint,
        tokenEstimate,
        lastUsedAt: now,
        hitCount: 1,
      });
    } else {
      // Cache miss: new session or invalidated context (new sources/chunks/notebook)
      isHit = false;
      reason = existingSession ? 'context_changed' : 'new_session';
      this.totalMisses += 1;

      // Register new fingerprint for this session
      this.sessionMap.set(sessionKey, {
        fingerprint,
        tokenEstimate,
        lastUsedAt: now,
        hitCount: 0,
      });
      this.globalMap.set(fingerprint, 0);

      // LRU Eviction if over capacity
      if (this.sessionMap.size > this.maxEntries) {
        const oldestKey = this.sessionMap.keys().next().value;
        if (oldestKey) this.sessionMap.delete(oldestKey);
      }
    }

    // Dev-only telemetry logging
    this.logTelemetry(sessionKey, isHit, reason, shortKey, tokenEstimate, tokensSaved);

    return {
      isHit,
      fingerprint,
      shortKey,
      reason,
      estimatedTokens: tokenEstimate,
      tokensSaved,
    };
  }

  /**
   * Formats the static system message with provider-native `cache_control: { type: "ephemeral" }`
   * breakpoint for OpenRouter, Anthropic Claude, and Gemini caching proxies.
   */
  public buildCachedSystemMessage(
    systemPrompt: string,
    enableCacheControl = true
  ): { role: 'system'; content: string | CachedSystemBlock[] } {
    if (!enableCacheControl || !systemPrompt.trim()) {
      return { role: 'system', content: systemPrompt };
    }

    return {
      role: 'system',
      content: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
    };
  }

  /**
   * Diagnostic telemetry log output.
   */
  private logTelemetry(
    sessionKey: string,
    isHit: boolean,
    reason: string,
    shortKey: string,
    tokenEstimate: number,
    tokensSaved: number
  ) {
    const icon = isHit ? '🟢 [HIT]' : '⚪ [MISS]';
    const tag = `[Prompt Cache ${shortKey}]`;
    const details = isHit
      ? `Saved: ~${tokensSaved} tokens | Reason: ${reason}`
      : `Reason: ${reason} | Block Size: ~${tokenEstimate} tokens`;

    console.log(
      `${icon} ${tag} Session: "${sessionKey || 'anonymous'}" | ${details} (Total Hits: ${this.totalHits}, Saved: ~${this.totalTokensSaved} tokens)`
    );
  }

  public getStats() {
    return {
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      totalTokensSaved: this.totalTokensSaved,
      activeSessions: this.sessionMap.size,
      activePrefixes: this.globalMap.size,
    };
  }

  public clear() {
    this.sessionMap.clear();
    this.globalMap.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
    this.totalTokensSaved = 0;
  }
}

/** Global singleton prompt cache manager */
export const promptCache = new PromptCacheTracker();
