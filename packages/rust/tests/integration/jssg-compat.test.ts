/**
 * JSSG compatibility integration test (T039).
 *
 * Verifies that the rust-ir API surface can be used as a JSSG transform:
 * - Imports work correctly from src/index
 * - `structItem` + `render` + `validate` pipeline completes without errors
 * - `validate()` returns `ok: true` for generated output
 *
 * Note: in this Vitest environment `codemod:ast-grep` is aliased to the
 * heuristic mock (tests/__mocks__/ast-grep.ts). True end-to-end verification
 * against the live JSSG runtime requires running via `codemod` CLI.
 */
import { describe, it, expect } from 'vitest';
import { buildPublicStruct } from '../fixtures/simple-struct.transform.js';
import {
	structItem,
	render,
	validate,
	sourceFile,
	useDeclaration,
	implItem,
	functionItem,
	macroInvocation,
	ifExpression,
} from '../../src/index.js';

describe('JSSG transform fixture — rust-ir API compatibility', () => {
	it('buildPublicStruct produces valid Rust with ok:true from validate', () => {
		const output = buildPublicStruct('Config');
		expect(output).not.toBeNull();
		expect(output).toContain('pub struct Config;');
		const vr = validate(output!);
		expect(vr.ok).toBe(true);
	});

	it('buildPublicStruct returns null for empty name', () => {
		const output = buildPublicStruct('');
		expect(output).toBeNull();
	});

	it('full source file pipeline: use + struct + impl — validates ok (SC-005)', () => {
		const method = functionItem({
			name: 'new',
			returnType: 'Self',
			body: 'Self { entries: HashMap::new() }',
			children: ['pub'],
		});
		const node = sourceFile({
			children: [
				render(useDeclaration({ argument: 'std::collections::HashMap' })),
				render(
					structItem({
						name: 'Registry',
					body: 'entries: HashMap<String, u32>,',
						children: ['pub'],
					}),
				),
				render(
					implItem({
						type: 'Registry',
						body: render(method),
					}),
				),
			],
		});
		const output = render(node);
		const vr = validate(output);
		expect(vr.ok).toBe(true);
		expect(output).toContain('use std::collections::HashMap;');
		expect(output).toContain('pub struct Registry');
		expect(output).toContain('impl Registry {');
		expect(output).toContain('pub fn new()');
	});

	it('all 7 IR node kinds export correctly from src/index.ts', () => {
		// structItem
		expect(structItem({ name: 'A' })).toMatchObject({ kind: 'struct_item', name: 'A' });
		// functionItem
		expect(functionItem({ name: 'f', body: '42' })).toMatchObject({ kind: 'function_item' });
		// useDeclaration
		expect(useDeclaration({ argument: 'a::B' })).toMatchObject({ kind: 'use_declaration' });
		// implItem
		expect(implItem({ type: 'X' })).toMatchObject({ kind: 'impl_item' });
		// ifExpression
		expect(ifExpression({ condition: 'true', consequence: '1' })).toMatchObject({
			kind: 'if_expression',
		});
		// macroInvocation
		expect(macroInvocation({ macro: 'vec', children: '1, 2, 3' })).toMatchObject({
			kind: 'macro_invocation',
		});
		// sourceFile (already tested above)
	});
});

describe('render() edge cases', () => {
	it('throws on unknown node kind at runtime', () => {
		const bogus = { kind: 'bogus_node' } as never;
		expect(() => render(bogus)).toThrow(/node kind/i);
	});

	it('throws when renderChild receives a non-string non-node value via sourceFile', () => {
		// Force a number into children to exercise the renderChild guard
		const node = sourceFile({ children: [42 as never] });
		expect(() => render(node)).toThrow(/expected a string or RustIrNode/i);
	});

	it('validate returns ok:false when source is invalid Rust', () => {
		const result = validate('pub struct {');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].offset).toBeGreaterThanOrEqual(0);
		}
	});
});
