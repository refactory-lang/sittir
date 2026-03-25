import { describe, it, expect } from 'vitest';
import { emitIndex } from '../../../src/emitters/index-file.ts';

describe('emitIndex', () => {
	it('should re-export types, ir, rules, and core', () => {
		const source = emitIndex({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
		expect(source).toContain("from './types.js'");
		expect(source).toContain("from './ir.js'");
		expect(source).toContain("from './rules.js'");
		expect(source).toContain("from './consts.js'");
		expect(source).toContain("from '@sittir/core'");
		expect(source).toContain('NodeData');
		expect(source).toContain('render');
		// Should NOT export old files
		expect(source).not.toContain('Builder');
		expect(source).not.toContain('LeafBuilder');
		expect(source).not.toContain("from './builder.js'");
	});
});
