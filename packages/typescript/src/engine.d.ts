/**
 * Grammar-specific engine factory for @sittir/typescript.
 *
 * Thin wrapper — all engine logic lives in createGrammarEngine from
 * @sittir/core/engine. Grammar-specific wiring (KIND_NAMES,
 * toNativeRenderTransport, getActiveBackend) is passed via GrammarEngineConfig.
 */
import { type SittirEngineLike, type EngineOptions } from '@sittir/core/engine';
export type { EngineOptions };
/**
 * Create a grammar-specific engine instance.
 *
 * Attempts to use the native backend if available; falls back to the JS
 * engine (Nunjucks renderer) otherwise.
 *
 * @param options - Engine configuration (format, etc.)
 * @returns An engine implementing SittirEngineLike.
 */
export declare function createEngine(options?: EngineOptions): SittirEngineLike;
//# sourceMappingURL=engine.d.ts.map