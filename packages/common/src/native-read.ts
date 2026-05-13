import type { AnyNodeData } from '@sittir/types';

/**
 * Backward-compatible no-op kept for callers that still import the
 * former native-read normalizer. Native/common should only pass native
 * read values through.
 */
export function normalizeNativeReadNode(
	raw: AnyNodeData,
	_source: string,
	_readRawNode?: (handle: number, childIndex: number) => AnyNodeData
): AnyNodeData {
	return raw;
}
