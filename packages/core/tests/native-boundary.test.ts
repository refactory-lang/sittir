import { describe, expect, it } from 'vitest';

import {
	assertNativeNodeData,
	isNativeNodeData
} from '../src/native-boundary.ts';
import type { AnyNodeData, FormatRecord } from '../src/types.ts';

const leaf: AnyNodeData = {
	$type: 'identifier',
	$source: 'factory',
	$named: true,
	$text: 'name'
};

describe('native render boundary', () => {
	it('rejects per-node $format overrides', () => {
		const format: FormatRecord = { boundary: { leading: '  ' } };
		const withFormat: AnyNodeData = { ...leaf, $format: format };

		expect(() => assertNativeNodeData(withFormat)).toThrow(/\$format/);
		expect(isNativeNodeData(withFormat)).toBe(false);
	});

	it('still accepts other TS-only metadata the native renderer recomputes', () => {
		const withVariant: AnyNodeData = { ...leaf, $variant: 'explicit' };

		expect(() => assertNativeNodeData(withVariant)).not.toThrow();
		expect(isNativeNodeData(withVariant)).toBe(true);
	});
});
