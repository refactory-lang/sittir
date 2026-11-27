// Narrow sentinel check over the typescript factories that accept options: each
// forwarder (or own-options factory) that takes options, called through the real
// builders with a distinguishable option and checked against a no-options baseline.
// Set size and predicate: the emitter's own predicates (forwardedTargetKind,
// spellingTypeOf, forwardedOptionsTarget, twoLevelTarget) over the typescript node map
// select 6 factories: break_statement, continue_statement, class_static_block,
// export_statement_namespace_export, _formal_parameters_set_accessor_signature,
// _formal_parameters_elements_set_accessor_signature. A sentinel that is accepted and
// dropped shows up as a render that lacks the sentinel's token.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

describe('options given to a forwarding or own-options factory reach the built node', () => {
	it('break: an undefined value keeps the terminator option', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		expect(ts.build.breakStatement(undefined, { terminator: ts.kinds.AutomaticSemicolon }).$render().trimEnd()).toBe('break');
		expect(ts.build.breakStatement().$render()).toBe('break;');
	});

	it('continue: an undefined value keeps the terminator option', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		expect(ts.build.continueStatement(undefined, { terminator: ts.kinds.AutomaticSemicolon }).$render().trimEnd()).toBe('continue');
		expect(ts.build.continueStatement().$render()).toBe('continue;');
	});

	it('class static block: an undefined value keeps the terminator option', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		expect(ts.build.classStaticBlock(undefined, { terminator: ts.kinds.AutomaticSemicolon }).terminator()).toBe(ts.kinds.AutomaticSemicolon);
	});

	it('export namespace export: a value keeps the terminator option', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const withOption = ts.build.exportStatementNamespaceExport(ts.build.identifier('x'), { terminator: ts.kinds.AutomaticSemicolon }).$render();
		const without = ts.build.exportStatementNamespaceExport(ts.build.identifier('x')).$render();
		expect(withOption).not.toBe(without);
		expect(withOption).not.toContain(';');
	});

	it('setter signature: the trailing comma option reaches the render', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const parameter = ts.build.setterParameter({ pattern: ts.kinds.This });
		const withComma = ts.build.formalParametersSetAccessorSignature(parameter, { trailingComma: ts.kinds.Comma }).$render();
		const without = ts.build.formalParametersSetAccessorSignature(parameter).$render();
		expect(withComma).not.toBe(without);
		expect(withComma).toContain(',');
	});
});
