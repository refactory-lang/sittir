/**
 * Backend-selection shim — spec 012 T040 (real selection algorithm;
 * overwrites the T019 stub). Picks between the native backend
 * (the grammar-local `sittir-typescript` build) and the TypeScript fallback. See
 * specs/012-rust-core-port/contracts/backend-selection.md for the
 * runtime-selection contract.
 *
 * The selection runs once per module load, is cached as a module-local
 * singleton, never retries, and is reference-stable across the process
 * lifetime. A failure to load native falls back silently to the TS
 * engine; consumers see the decision via `getActiveBackend()` and
 * optionally via the `SITTIR_BACKEND_DEBUG` stderr nudge.
 */
import type { NodeId } from '@sittir/types';
import type { AnyTransport } from './types.js';
/** Which backend is currently serving render/read/splice. */
export type BackendName = 'native' | 'js';
/** User-facing backend choices. `auto` is the default policy. */
export type BackendChoice = 'auto' | 'native' | 'wasm' | 'js';
export type NativeBackendStatus = {
    readonly name: 'native';
    readonly hashMatch: true;
    readonly native: NativeModule;
};
export type JsBackendStatus = {
    readonly name: 'js';
    readonly reason: string;
    readonly hashMatch?: false;
};
/** Result of a backend selection. Frozen — consumers cannot mutate. */
export type BackendStatus = NativeBackendStatus | JsBackendStatus;
/**
 * Structural shape of the grammar-local `sittir-typescript` native module. Matches
 * contracts/napi-api.md — we only require `SittirEngine` with the
 * documented surface. Declared locally (not imported) so the package
 * type-checks even when the native package is not installed.
 */
export interface NativeEngine {
    readonly templateBundleHash: string;
    readonly nativeRenderTransportAbi: number;
    parseAndRead(source: string): string;
    findAndRead(source: string, pattern: string): string;
    readNode(nodeId: NodeId): string;
    render(node: AnyTransport): string;
    applyEdits(source: string, edits: {
        startPos: number;
        endPos: number;
        insertedText: string;
    }[]): string;
    dispose(): void;
}
export interface NativeModule {
    SittirEngine: new (options?: {
        format?: string;
    }) => NativeEngine;
}
/**
 * Return the active backend for this package. Safe to call from any
 * consumer code path — never throws, never writes to stdout, writes
 * at most one line to stderr across the process lifetime (gated on
 * `SITTIR_BACKEND_DEBUG`).
 */
export declare function getActiveBackend(): BackendStatus;
//# sourceMappingURL=backend.d.ts.map