import { describe, it, expect } from 'vitest';
import { emitIndex } from '../../../src/emitters/index-file.ts';

describe('emitIndex', () => {
	it('should re-export types, ir, and core', () => {
		const source = emitIndex({ grammar: 'rust', nodes: [] });
		expect(source).toContain("from './types.js'");
		expect(source).toContain("from './ir.js'");
		expect(source).toContain("from './consts.js'");
		expect(source).toContain("from '@sittir/core'");
		expect(source).toContain('NodeData');
		expect(source).toContain('createRenderer');
		// Should NOT export old files
		expect(source).not.toContain("from './rules.js'");
		expect(source).not.toContain("from './joinby.js'");
		expect(source).not.toContain("from './builder.js'");
	});
});
