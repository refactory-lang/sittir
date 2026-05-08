import type { AnyNodeData } from '@sittir/types';

/**
 * Backward-compatible no-op kept for callers that still import the
 * former native-read normalizer. Native read payloads now match the
 * ADR-0018 de-hoisted JS shape at the source, so no TS-side rewrite is
 * required for correctness.
 */
export function normalizeNativeReadNode(raw: AnyNodeData, _source: string): AnyNodeData {
	return raw;
}
