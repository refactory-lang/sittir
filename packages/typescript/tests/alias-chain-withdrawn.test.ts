import { describe, expect, it } from 'vitest';
import { ir as irBuilders } from '../src/ir.ts';

const ir = irBuilders as unknown as Record<string, any>;

describe('a chained route through an alias is withdrawn', () => {
	it('has no builder for exportStatementDefaultDeclaration.ambient.module', () => {
		expect(ir.exportStatementDefaultDeclaration?.ambient?.module).toBeUndefined();
	});
});
