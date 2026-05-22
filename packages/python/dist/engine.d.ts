import { type SittirEngineLike, type EngineOptions } from '@sittir/common/engine';
export type { EngineOptions };
/**
 * Create a grammar-specific engine instance.
 *
 * Attempts to use the native backend if available; falls back to the JS
 * engine otherwise.
 *
 * @param options - Engine configuration (format, etc.)
 * @returns An engine implementing SittirEngineLike.
 */
export declare function createEngine(options?: EngineOptions): SittirEngineLike;
//# sourceMappingURL=engine.d.ts.map