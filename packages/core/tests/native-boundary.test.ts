import { describe, expect, it } from 'vitest';

import {
	assertNativeNodeData,
	assertRenderableNodeData,
	isNativeNodeData,
	isRenderableNodeData
} from '../src/native-boundary.ts';
import type { AnyNodeData, FormatRecord } from '../src/types.ts';

// Use a numeric $type (Phase D: parser.c-derived KindId). Any finite integer
// stands in here since @sittir/core has no grammar-specific TSKindId enum.
const MOCK_KIND_ID = 42;

const leaf: AnyNodeData = {
	$type: MOCK_KIND_ID,
	$source: 2,
	$named: true,
	$text: 'name'
};

describe('native render boundary', () => {
	it('rejects per-node $format overrides', () => {
		const format: FormatRecord = { boundary: { leading: '  ' } };
		const withFormat: AnyNodeData = { ...leaf, $format: format };

		expect(() => assertRenderableNodeData(withFormat)).toThrow(/\$format/);
		expect(isRenderableNodeData(withFormat)).toBe(false);
		// Backward-compat aliases behave identically.
		expect(() => assertNativeNodeData(withFormat)).toThrow(/\$format/);
		expect(isNativeNodeData(withFormat)).toBe(false);
	});

	it('still accepts other TS-only metadata the native renderer recomputes', () => {
		const withVariant: AnyNodeData = { ...leaf, $variant: 'explicit' };

		expect(() => assertRenderableNodeData(withVariant)).not.toThrow();
		expect(isRenderableNodeData(withVariant)).toBe(true);
		// Backward-compat aliases behave identically.
		expect(() => assertNativeNodeData(withVariant)).not.toThrow();
		expect(isNativeNodeData(withVariant)).toBe(true);
	});

	it('accepts boolean keyword-presence field storage', () => {
		const withBooleanMarker: AnyNodeData = { ...leaf, _optional_marker: true };

		expect(() => assertRenderableNodeData(withBooleanMarker)).not.toThrow();
		expect(isRenderableNodeData(withBooleanMarker)).toBe(true);
		expect(() => assertNativeNodeData(withBooleanMarker)).not.toThrow();
		expect(isNativeNodeData(withBooleanMarker)).toBe(true);
	});

	it('rejects non-data values at the native transport boundary', async () => {
		const invalidNode = {
			$type: MOCK_KIND_ID,
			$source: 2,
			$named: true,
			$text: 'x',
			render: () => 'nope'
		} as const;

		expect(() => assertRenderableNodeData(invalidNode as never)).toThrow(/render/);
		expect(() => assertNativeNodeData(invalidNode as never)).toThrow(/render/);
	});

	it('rejects string $type (must be numeric Phase D)', () => {
		const withStringType = {
			$type: 'identifier',
			$source: 2 as const,
			$named: true,
			$text: 'x'
		};

		expect(() => assertRenderableNodeData(withStringType as unknown as AnyNodeData)).toThrow(/must be a number/);
		expect(isRenderableNodeData(withStringType as unknown as AnyNodeData)).toBe(false);
	});
});
