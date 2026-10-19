import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateDsl } from '../../compiler/evaluate.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { runTreeSitterCliCapturing } from '../../transpile/tree-sitter-cli.ts';
import { verbCtxOf } from '../verbs/copy.ts';
import { renameMapOf, type Effect } from '../verbs/effects.ts';
import { applyRename, applyRenames, renamedLists, type RenameScope } from '../verbs/rename.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const chain = (name: string): string => resolve(here, 'fixtures/layer-chain', name);

const SYM = (name: string, extra: Record<string, unknown> = {}) => ({ type: 'SYMBOL', name, ...extra });
const STRING = (value: string) => ({ type: 'STRING', value });
const SEQ = (...members: unknown[]) => ({ type: 'SEQ', members });
const CHOICE = (...members: unknown[]) => ({ type: 'CHOICE', members });
const ALIAS = (content: unknown, value: string, extra: Record<string, unknown> = {}) => ({ type: 'ALIAS', content, value, named: true, ...extra });
const BLANK = { type: 'BLANK' };

const SCOPE: RenameScope = { depth: 2, factoryInline: new Set<string>() };

function ctxOf(rules: Record<string, unknown>, extra: Record<string, unknown> = {}) {
	return verbCtxOf({ name: 'g', rules, ...extra } as never);
}

describe('applyRenames: the body moves, and every kind reference follows it', () => {
	it('moves the body to the new name, blanks the old one, records it as created, and logs the effect', () => {
		const ctx = ctxOf({
			program: SEQ(SYM('kind'), STRING('x')),
			kind: SEQ(SYM('x'), STRING(';'))
		});
		applyRenames([{ from: 'kind', to: 'renamed' }], ctx, SCOPE);
		expect(ctx.rules.renamed).toEqual(SEQ(SYM('x'), STRING(';')));
		expect(ctx.rules.kind).toEqual(BLANK);
		expect(ctx.created).toEqual(['renamed']);
		expect(ctx.effects).toEqual([{ kind: 'rename', from: 'kind', to: 'renamed' }]);
	});

	it('renames a symbol, a named alias value, and a variantOf annotation, but a STRING spelling the kind stays', () => {
		const ctx = ctxOf({
			program: SEQ(SYM('kind'), STRING('kind')),
			kind: SEQ(SYM('x'), STRING(';')),
			aliased: ALIAS(SYM('y'), 'kind'),
			choice: CHOICE(SYM('kind', { annotations: { variantOf: 'kind' } }), SYM('z'))
		});
		applyRenames([{ from: 'kind', to: 'renamed' }], ctx, SCOPE);
		expect(ctx.rules.program).toEqual(SEQ(SYM('renamed'), STRING('kind')));
		expect(ctx.rules.aliased).toEqual(ALIAS(SYM('y'), 'renamed'));
		expect(ctx.rules.choice).toEqual(CHOICE(SYM('renamed', { annotations: { variantOf: 'renamed' } }), SYM('z')));
	});
});

describe('applyRename refusals', () => {
	const refused = (entry: { from: string; to: string }, rules: Record<string, unknown>) => {
		const ctx = ctxOf(rules);
		applyRenames([entry], ctx, SCOPE);
		return ctx.diagnostics.map((diagnostic) => [diagnostic.code, diagnostic.message]);
	};
	const rules = { program: SYM('kind'), kind: SEQ(SYM('x'), STRING(';')), choice: CHOICE(SYM('kind'), SYM('z')) };

	it('refuses a source that is no rule or external of the grammar', () => {
		expect(refused({ from: 'nope', to: 'other' }, rules)).toEqual([['rename-invalid', "rename 'nope' to 'other': the source is no rule or external of the grammar"]]);
	});

	it('refuses the start rule, which stays first', () => {
		expect(refused({ from: 'program', to: 'prog' }, rules)).toEqual([['rename-invalid', "rename 'program' to 'prog': the source is the start rule, which stays first"]]);
	});

	it('refuses a rename that flips hiddenness', () => {
		expect(refused({ from: 'kind', to: '_kind' }, rules)).toEqual([['rename-invalid', "rename 'kind' to '_kind': it flips hiddenness"]]);
	});

	it('refuses a target the grammar already names, since that would be a merge', () => {
		expect(refused({ from: 'kind', to: 'choice' }, rules)).toEqual([
			['rename-invalid', "rename 'kind' to 'choice': the grammar already names 'choice', so it would be a merge, which an alias declares"]
		]);
	});

	it('changes nothing when a rename is refused', () => {
		const ctx = ctxOf({ ...rules });
		const before = JSON.stringify({ rules: ctx.rules, effects: ctx.effects, created: ctx.created });
		applyRenames([{ from: 'program', to: 'prog' }, { from: 'kind', to: 'choice' }], ctx, SCOPE);
		expect(JSON.stringify({ rules: ctx.rules, effects: ctx.effects, created: ctx.created })).toBe(before);
		expect(ctx.diagnostics).toHaveLength(2);
	});
});

describe('externals, chains and lists', () => {
	it('renames an external that is no rule, appending no rule and no blank', () => {
		const ctx = ctxOf({ program: SEQ(SYM('ext'), STRING(';')) }, { externals: [SYM('ext')] });
		applyRename({ from: 'ext', to: 'ext2' }, ctx, SCOPE);
		expect(ctx.rules).toEqual({ program: SEQ(SYM('ext2'), STRING(';')) });
		expect(ctx.created).toEqual([]);
		expect(ctx.effects).toEqual([{ kind: 'rename', from: 'ext', to: 'ext2' }]);
	});

	it('resolves a chain so each vacated name maps to its final name', () => {
		const effects: Effect[] = [
			{ kind: 'rename', from: 'a', to: 'b' },
			{ kind: 'rename', from: 'b', to: 'c' }
		];
		const map = renameMapOf(effects);
		expect(map.get('a')).toBe('c');
		expect(map.get('b')).toBe('c');
	});

	it('renames only kind references under refs, and bare strings too under names', () => {
		const effects: Effect[] = [{ kind: 'rename', from: 'kind', to: 'renamed' }];
		const lists = { externals: [SYM('kind'), STRING('kind')], word: 'kind' };
		expect(renamedLists(lists, { externals: 'refs', word: 'names' }, effects)).toEqual({
			externals: [SYM('renamed'), STRING('kind')],
			word: 'renamed'
		});
	});

	it('returns the input object itself when there are no renames', () => {
		const lists = { externals: [SYM('kind')], word: 'kind' };
		expect(renamedLists(lists, { externals: 'refs', word: 'names' }, [])).toBe(lists);
	});
});

describe('the migrated rename-grammar cases', () => {
	it('renames the kind an annotation names, and leaves a label that happens to spell a kind', () => {
		const ctx = ctxOf({
			program: SYM('impl_item'),
			impl_item: CHOICE(SYM('body', { annotations: { variant: 'body', variantOf: 'impl_item' } })),
			body: STRING('{}')
		});
		applyRenames(
			[
				{ from: 'impl_item', to: 'impl_declaration' },
				{ from: 'body', to: 'impl_body' }
			],
			ctx,
			SCOPE
		);
		expect(ctx.rules.impl_declaration).toEqual(CHOICE(SYM('impl_body', { annotations: { variant: 'body', variantOf: 'impl_declaration' } })));
	});

	it('leaves a metadata string that happens to spell a kind', () => {
		const ctx = ctxOf({
			program: SYM('block'),
			block: { type: 'SYMBOL', name: 'statement', metadata: { symbolSource: 'statement' } },
			statement: BLANK
		});
		applyRenames([{ from: 'statement', to: 'statement_x' }], ctx, SCOPE);
		expect(ctx.rules.block).toEqual({ type: 'SYMBOL', name: 'statement_x', metadata: { symbolSource: 'statement' } });
	});
});

describe('a layer-2 rename over the fixture chain', () => {
	it('renames the kind in the top layer, blanks the old name, and records the rename in its conflicts', async () => {
		const evaluated = (await evaluateDsl(chain('rename-layer2.ts'))) as {
			rules: Record<string, unknown>;
			conflicts: unknown;
			renamedFrom: unknown;
		};
		expect(evaluated.rules.binary_expression).toEqual({ type: 'BLANK' });
		expect(evaluated.rules.binary_op).toBeDefined();
		expect(evaluated.conflicts).toEqual([['call_expression', 'binary_op']]);
		expect(evaluated.renamedFrom).toEqual({ binary_op: 'binary_expression' });
	});
});

const messagesOf = async (name: string): Promise<string[]> => {
	const evaluated = (await evaluateDsl(chain(name))) as { layerDiagnostics?: readonly { readonly message: string }[] };
	return (evaluated.layerDiagnostics ?? []).map((diagnostic) => diagnostic.message).sort();
};

describe('a rename in the first layer is refused, and nothing is renamed', () => {
	it('refuses each rename with the no-provenance reason, and a rename at path 0 as an edit at the wrong path', async () => {
		expect(await messagesOf('rename-layer1.ts')).toEqual(
			[
				"edits: 'number': a rename entry applies at '.', the kind itself, not at '0'",
				"rename 'binary_expression' to 'binary_op': the first layer records no provenance, so a rename there could not give renamedFrom",
				"rename 'program' to 'prog': the first layer records no provenance, so a rename there could not give renamedFrom",
				"rename 'let_statement' to 'expression_statement': the first layer records no provenance, so a rename there could not give renamedFrom",
				"rename '_statement' to 'statement': the first layer records no provenance, so a rename there could not give renamedFrom"
			].sort()
		);
	});

	it('keeps the rules as they are, with no binary_op', async () => {
		const evaluated = (await evaluateDsl(chain('rename-layer1.ts'))) as { rules: Record<string, unknown> };
		expect('binary_op' in evaluated.rules).toBe(false);
		expect(evaluated.rules.binary_expression).toBeDefined();
	});
});

describe('the layer-level refusals of a rename in a layer above the first', () => {
	it('refuses the start rule, a taken target, and a hiddenness flip, each with its own reason', async () => {
		expect(await messagesOf('rename-refused-layer2.ts')).toEqual(
			[
				"rename 'program' to 'prog': the source is the start rule, which stays first",
				"rename 'let_statement' to 'expression_statement': the grammar already names 'expression_statement', so it would be a merge, which an alias declares",
				"rename '_statement' to 'statement': it flips hiddenness"
			].sort()
		);
	});
});

describe('a rename of a factoryInline kind is refused, and a second rename in the same layer still applies', () => {
	it('refuses a factoryInline kind the layer inherits, and still applies the second rename', async () => {
		expect(await messagesOf('factory-inline-layer2.ts')).toEqual([
			"rename 'binary_expression' to 'binary_op': the source is a factoryInline kind, a list no rename rewrites"
		]);
		const evaluated = (await evaluateDsl(chain('factory-inline-layer2.ts'))) as { rules: Record<string, unknown> };
		expect(evaluated.rules.call).toBeDefined();
		expect('binary_op' in evaluated.rules).toBe(false);
	});

	it('refuses a factoryInline kind the layer declares itself', async () => {
		expect(await messagesOf('factory-inline-own.ts')).toEqual([
			"rename 'call_expression' to 'call': the source is a factoryInline kind, a list no rename rewrites"
		]);
	});
});

describe('the CLI generates a layer-2 rename with the pinned tree-sitter', () => {
	it('generates binary_op with binary_expression blank, and no binary_expression node type', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-rename-cli-'));
		try {
			writeFileSync(join(dir, 'grammar.js'), `export { default } from ${JSON.stringify(pathToFileURL(chain('rename-layer2.ts')).href)};\n`);
			writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'tree-sitter-rename', type: 'module' }));
			const run = runTreeSitterCliCapturing(['generate', '--json-summary'], dir);
			expect(run.status).toBe(0);
			const grammar = JSON.parse(readFileSync(join(dir, 'src/grammar.json'), 'utf8')) as {
				rules: Record<string, unknown>;
				conflicts: unknown;
			};
			expect(grammar.rules.binary_op).toBeDefined();
			expect(grammar.rules.binary_expression).toEqual({ type: 'BLANK' });
			expect(grammar.conflicts).toEqual([['call_expression', 'binary_op']]);
			const nodeTypes = JSON.parse(readFileSync(join(dir, 'src/node-types.json'), 'utf8')) as { type: string }[];
			const names = nodeTypes.map((node) => node.type);
			expect(names).toContain('binary_op');
			expect(names).not.toContain('binary_expression');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, FULL_PIPELINE_TIMEOUT);
});
