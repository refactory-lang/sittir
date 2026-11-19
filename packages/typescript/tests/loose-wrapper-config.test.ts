import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a loose hoisted slot takes its wrapper as a config bag, %s storage', (nodeStorage) => {
	it('builds a property signature whose type is the type annotation as a bag, a bare string and a built annotation alike', async () => {
		using ts = await createEngine(typescript, { nodeStorage });
		const asBag = ts.build.propertySignature({ name: 'a', type: { type: 'boolean' } });
		const asString = ts.build.propertySignature({ name: 'a', type: 'boolean' });
		const asAnnotation = ts.build.propertySignature({ name: 'a', type: ts.build.typeAnnotation({ type: 'boolean' }) });
		expect(String(ts.render(asBag))).toBe('a: boolean');
		expect(String(ts.render(asString))).toBe('a: boolean');
		expect(String(ts.render(asAnnotation))).toBe('a: boolean');
	});
});
