import { afterAll, describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import * as coerce from '../src/factories/coerce.ts';

const engine = await typescript.createEngine({ nodeStorage: 'object' });

afterAll(() => {
	engine.dispose();
});

const { coerceToFormalParametersElementsSetAccessorSignature: coerceElements, coerceToFormalParametersSetAccessorSignature: coerceSetter } = coerce;

describe('a setter that forwards options to its elements refuses them when the elements are already built', () => {
	const built = coerceElements({} as never);

	it('refuses options with a built elements node passed directly', () => {
		expect(() => coerceSetter(built as never, {} as never)).toThrow('carries its own options');
	});

	it('refuses options with a built elements node inside a config', () => {
		expect(() => coerceSetter({ elements: built } as never, {} as never)).toThrow('carries its own options');
	});

	it('builds the setter from a config with no options', () => {
		expect(coerceSetter({ elements: built } as never)).toBeDefined();
	});
});
