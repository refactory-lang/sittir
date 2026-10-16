import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';
import { parserRulesOf } from '../../compiler/canonical-rules.ts';
import { diagnoseGrammar } from '../../compiler/compile.ts';
import { evaluate, evaluateDsl, evaluatedGrammarOf, withDslGlobals } from '../../compiler/evaluate.ts';
import { evaluatePackage } from '../../compiler/evaluate-package.ts';
import type { EvaluatedGrammar } from '../../compiler/types.ts';
import { grammarPackage } from '../../grammars.ts';
import { canonical } from '../../transpile/evaluate-for-derivation.ts';
import { runTreeSitterCliCapturing, treeSitterCliVersion } from '../../transpile/tree-sitter-cli.ts';
import { alias, field, match, narrow, preference } from '../dsl-authoring.ts';
import type { GrammarResult } from '../enrich.ts';
import type { SymbolRule } from '../../grammar-shapes/grammar-json.ts';
import { enrichFixpoint, layerOptions, pendingBase } from '../layer.ts';
import { layerRecordOf } from '../layer-record.ts';
import { lead } from '../primitives/lead.ts';
import { SENTINEL } from './fixtures/layer-chain/sentinel.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const chain = (name: string): string => resolve(here, 'fixtures/layer-chain', name);
const layerRecordModule = pathToFileURL(resolve(here, '../layer-record.ts')).href;
const packages = resolve(here, '../../../..');
const require = createRequire(import.meta.url);
const checks = vi.hoisted(() => ({ count: 0, bases: [] as string[] }));

vi.mock('../enrich.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../enrich.ts')>();
	return {
		...actual,
		withEnrichSidecarsOf: <G extends object>(grammar: G, enriched: unknown): G => {
			checks.count++;
			checks.bases.push(JSON.stringify(grammar));
			return actual.withEnrichSidecarsOf(grammar, enriched);
		}
	};
});

type RuntimeGrammar = (base: unknown, options?: unknown) => GrammarResult;
type Symbols = Readonly<Record<string, SymbolRule<string>>>;
type Config = Parameters<typeof layerOptions>[0];
const runtimeGrammar = (): RuntimeGrammar => (globalThis as unknown as { grammar: RuntimeGrammar }).grammar;

function upstream(rules: Record<string, unknown> = {}): GrammarResult {
	return runtimeGrammar()({
		name: 'up',
		externals: ($: Symbols) => [$.marker],
		rules: { program: ($: Symbols) => repeat($.item!), item: () => /[a-z]+/, ...rules }
	});
}

function layer(base: GrammarResult, config: Config): GrammarResult {
	return runtimeGrammar()(pendingBase(base), layerOptions(config));
}

const probeModule = (layerUrl: string, log: string): string => `import { appendFileSync } from 'node:fs';
import { layerRecordOf } from ${JSON.stringify(layerRecordModule)};
const log = (line) => appendFileSync(${JSON.stringify(log)}, line + '\\n');
const runtimeGrammar = globalThis.grammar;
globalThis.grammar = function probedGrammar(base, options) {
	if (options === undefined) return runtimeGrammar(base);
	let passed = false;
	const probe = new Proxy(options, {
		get(target, key, receiver) {
			if (key === 'rules') log(passed ? 'rules after the pass' : 'rules before the pass');
			const value = Reflect.get(target, key, receiver);
			if (key !== 'externals' || typeof value !== 'function') return value;
			return function probedEntry(...args) {
				log('pass');
				const out = value.apply(this, args);
				passed = true;
				return out;
			};
		}
	});
	const result = runtimeGrammar(base, probe);
	log('record ' + layerRecordOf(result)?.depth);
	return result;
};
export default (await import(${JSON.stringify(layerUrl)})).default;
`;

function generateWithCli(layerFile: string): { readonly grammarJson: string; readonly events: readonly string[] } {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-layer-chain-'));
	try {
		const log = join(dir, 'events.log');
		writeFileSync(log, '');
		writeFileSync(join(dir, 'grammar.js'), probeModule(pathToFileURL(chain(layerFile)).href, log));
		const run = runTreeSitterCliCapturing(['generate'], dir);
		if (run.status !== 0) throw new Error(`tree-sitter generate failed: ${run.stderr}`);
		return {
			grammarJson: readFileSync(join(dir, 'src/grammar.json'), 'utf8'),
			events: readFileSync(log, 'utf8').trim().split('\n')
		};
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

let chainRun: ReturnType<typeof generateWithCli> | undefined;
const cliChain = (): ReturnType<typeof generateWithCli> => (chainRun ??= generateWithCli('layer2.ts'));

const ruleListNames = (list: unknown): unknown[] =>
	(Array.isArray(list) ? list : []).map((entry) =>
		typeof entry === 'string' ? entry : (entry as { name?: string; value?: string }).name ?? (entry as { value?: string }).value
	);

describe('the pending base', () => {
	it('reads its name and externals before the pass completes it, and refuses its rules', async () => {
		await withDslGlobals(async () => {
			const base = upstream();
			const pending = pendingBase(base);
			expect(pending.grammar.name).toBe('up');
			expect(ruleListNames(pending.grammar.externals)).toEqual(['marker']);
			expect(() => pending.grammar.rules).toThrow(/before the layer pass/);
		});
	});

	it("gives the runtime a reserved object of its own, so a layer's reserved sets never reach its base", async () => {
		await withDslGlobals(async () => {
			const base = upstream();
			const pending = pendingBase(base);
			runtimeGrammar()(pending, layerOptions({}));
			const reserved = pending.grammar.reserved as Record<string, unknown>;
			expect(reserved).not.toBe(base.grammar.reserved);
			reserved.global = [];
			expect(base.grammar.reserved).toEqual({});
		});
	});
});

describe('the hook guards', () => {
	it('refuses a read of options.rules before the pass has run, naming the tree-sitter version the order was verified against', () => {
		const options = layerOptions({});
		expect(() => options.rules).toThrow(/0\.26\.9/);
	});

	it('refuses a second call of the externals callback with one handle', async () => {
		await withDslGlobals(async () => {
			const pending = pendingBase(upstream());
			const options = layerOptions({});
			const $ = new Proxy({}, { get: (_target, name) => sym(String(name)) });
			options.externals!.call($, $, pending.grammar.externals);
			expect(() => options.externals!.call($, $, pending.grammar.externals)).toThrow(/already/);
		});
	});

	it('refuses a base that carries a handle no pass consumed', async () => {
		await withDslGlobals(async () => {
			const pending = pendingBase(upstream());
			expect(() => pendingBase(pending as unknown as GrammarResult)).toThrow(/no layer pass consumed/);
		});
	});

	it('runs the pass once per layer under the pinned CLI, before tree-sitter builds $', () => {
		expect(treeSitterCliVersion(), 'the layer hook rests on the order in which tree-sitter 0.26.9 calls the callbacks; verify that order again before moving the pin').toBe(
			'0.26.9'
		);
		const { events } = cliChain();
		const layers: string[][] = [[]];
		for (const event of events) {
			layers.at(-1)!.push(event);
			if (event.startsWith('record ')) layers.push([]);
		}
		layers.pop();
		expect(layers.map((events) => events.at(-1))).toEqual(['record 1', 'record 2']);
		for (const events of layers) {
			expect(events[0]).toBe('pass');
			expect(events.filter((event) => event === 'pass')).toHaveLength(1);
			expect(events).not.toContain('rules before the pass');
			expect(events).toContain('rules after the pass');
		}
	});
});

describe('the layer record', () => {
	it('never reaches the grammar.json the pinned CLI writes', () => {
		const { grammarJson } = cliChain();
		expect(grammarJson).not.toContain(SENTINEL);
	});

	it('rides on the first rule when rules: overrides the start rule', async () => {
		await withDslGlobals(async () => {
			const result = layer(upstream(), { rules: { program: ($: Symbols) => repeat1($.item!) } });
			expect(layerRecordOf(result)?.depth).toBe(1);
		});
	});

	it('rides on the first rule when an entry edits the start rule', async () => {
		await withDslGlobals(async () => {
			const result = layer(upstream(), { edits: { program: { 0: field('items') } } });
			expect(layerRecordOf(result)?.depth).toBe(1);
		});
	});

	it('rides on a start rule whose body is a bare string, normalized first', async () => {
		await withDslGlobals(async () => {
			const result = layer(upstream(), { rules: { program: () => 'x' } });
			expect(Object.values(result.grammar.rules)[0]).toMatchObject({ type: 'STRING', value: 'x' });
			expect(layerRecordOf(result)?.depth).toBe(1);
		});
	});
});

describe('a groups: entry in a layer', () => {
	it('whose body the final rules nowhere hold is a bodyPatternZeroMatches name, of its layer and the layer above, but not of its base', async () => {
		await withDslGlobals(async () => {
			const first = layer(upstream(), {
				rules: { pair: ($: Symbols) => seq('(', $.item!, ')') },
				groups: { held_group: ($: Symbols) => seq('(', $.item!, ')'), orphan_group: () => seq('a', 'b') }
			});
			const second = layer(first, {});
			expect(evaluatedGrammarOf(first).bodyPatternZeroMatches).toEqual(['_orphan_group']);
			expect(evaluatedGrammarOf(second).bodyPatternZeroMatches).toEqual(['_orphan_group']);
			expect(evaluatedGrammarOf(first).stages?.enriched.grammar.bodyPatternZeroMatches).toBeUndefined();
		});
	});
});

describe('an edits key that names no rule', () => {
	it('is edit-site-missing on the record, and the layer drops the entry while its other edits apply', async () => {
		await withDslGlobals(async () => {
			const base = upstream({ program: ($: Symbols) => repeat($.pair!), pair: ($: Symbols) => seq($.item!, ',', $.item!) });
			const result = layer(base, { edits: { missing: { 0: field('x') }, pair: { 0: field('left') } } });
			expect(result.grammar.rules).not.toHaveProperty('missing');
			expect(result.grammar.rules.pair).toMatchObject({ type: 'SEQ', members: [{ type: 'FIELD', name: 'left' }, expect.anything(), expect.anything()] });
			expect(layerRecordOf(result)?.diagnostics).toEqual([
				expect.objectContaining({ code: 'edit-site-missing', severity: 'fail', canProceed: false, grammar: 'up', ownerKind: 'missing' })
			]);
		});
	});

	it('accepts a key naming a kind the layer mints, after the key that mints it', async () => {
		await withDslGlobals(async () => {
			const base = upstream({ program: ($: Symbols) => repeat(seq($.item!, ',', $.item!)) });
			const result = layer(base, { edits: { program: { 0: alias('pair') }, _pair: { 0: field('left') } } });
			expect(result.grammar.rules._pair).toMatchObject({ type: 'SEQ', members: [{ type: 'FIELD', name: 'left' }, expect.anything(), expect.anything()] });
			expect(layerRecordOf(result)?.diagnostics).toEqual([]);
		});
	});

	it('blocks the compile gate', async () => {
		const evaluated = await evaluate(chain('missing-edit.ts'), []);
		expect(evaluated.rules).not.toHaveProperty('let_statemnt');
		const diagnosis = diagnoseGrammar({ grammar: 'chain', evaluated });
		expect(diagnosis.passed).toBe(false);
		expect(diagnosis.blocked).toEqual([expect.objectContaining({ code: 'edit-site-missing', grammar: 'chain', ownerKind: 'let_statemnt' })]);
	});
});

describe('a lead entry in a layer', () => {
	const listed = (): GrammarResult =>
		upstream({
			program: ($: Symbols) => repeat($.function_item!),
			function_item: ($: Symbols) => seq('fn', field('parameters', $.params!)),
			params: ($: Symbols) => seq(field('item', $._param!), repeat(seq(',', field('item', $._param!)))),
			_param: ($: Symbols) => choice($.self_param!, $.param!),
			self_param: () => 'self',
			param: () => /[a-z]+/
		});
	const RECEIVER = { params: { '.': lead('item', 'receiver', match('self_param')) } };

	it('applies after the paths, its receiver form and group the last rules, and records its copies on the layer record', async () => {
		await withDslGlobals(async () => {
			const result = layer(layer(listed(), {}), { edits: RECEIVER });
			const { rules } = result.grammar;
			expect(Object.keys(rules).slice(-2)).toEqual(['_params_receiver', 'params_receiver_group']);
			expect(JSON.stringify(rules.function_item)).toContain(JSON.stringify({ type: 'ALIAS', content: { type: 'SYMBOL', name: '_params_receiver' }, named: true, value: 'params_receiver' }));
			const record = layerRecordOf(result);
			expect(record?.diagnostics).toEqual([]);
			expect(record?.effects).toContainEqual(expect.objectContaining({ kind: 'copy', copy: '_params_receiver', source: 'params', display: 'params_receiver', origin: expect.objectContaining({ kind: 'lead', list: 'params', field: 'receiver' }) }));
		});
	});

	it('projects its copies as leadFrom, and itself after the field effects in bindingEffects', async () => {
		await withDslGlobals(async () => {
			const result = layer(layer(listed(), {}), { edits: { function_item: { '1': field('parameter_list') }, ...RECEIVER } });
			const projections = layerRecordOf(result)?.projections;
			expect(projections?.leadFrom).toEqual({ _params_receiver: 'params' });
			expect(projections?.bindingEffects.map((effect) => effect.kind)).toEqual(['segment', 'lead']);
			expect(projections?.bindingEffects.at(-1)).toEqual({
				kind: 'lead',
				list: 'params',
				item: 'item',
				field: 'receiver',
				receiver: 'params_receiver',
				group: 'params_receiver_group',
				restField: 'parameter_list',
				variants: {},
				admits: [{ kind: 'self_param' }]
			});
		});
	});

	it("reads its names as the base's, through the field entries of its own layer", async () => {
		await withDslGlobals(async () => {
			const named = upstream({
				program: ($: Symbols) => repeat($.function_item!),
				function_item: ($: Symbols) => seq('fn', field('parameters', $.params!)),
				params: ($: Symbols) => seq(field('item', $._param!), repeat(seq(',', field('item', $._param!)))),
				_param: ($: Symbols) => choice($.param!, $.rest!),
				param: ($: Symbols) => seq(field('pattern', choice($.self_name!, $.name!)), optional(seq(':', $.name!))),
				rest: ($: Symbols) => seq('...', $.name!),
				self_name: () => 'self',
				name: () => /[a-z]+/
			});
			const receiver = lead('item', 'receiver', match('param', { pattern: [match('self_name')] }));
			const result = layer(layer(named, {}), { edits: { param: { '0': field('binding') }, params: { '.': receiver } } });
			expect(layerRecordOf(result)?.diagnostics).toEqual([]);
			expect(layerRecordOf(result)?.projections?.leadFrom).toMatchObject({ _params_receiver: 'params' });
		});
	});

	it('records a refused lead with its code, and drops the entry', async () => {
		await withDslGlobals(async () => {
			const plain = layer(layer(listed(), {}), {});
			const refused = layer(layer(listed(), {}), { edits: { params: { '.': lead('item', 'receiver', match('missing')) } } });
			expect(Object.keys(refused.grammar.rules)).toEqual(Object.keys(plain.grammar.rules));
			expect(layerRecordOf(refused)?.diagnostics).toEqual([
				expect.objectContaining({ code: 'narrow-invalid', severity: 'fail', ownerKind: 'params', message: "lead 'params.receiver': it admits no item of the list" })
			]);
		});
	});
});

describe('a narrow entry in a layer', () => {
	const choices = (rules: Record<string, unknown> = {}): GrammarResult =>
		upstream({
			program: ($: Symbols) => repeat(choice($.pair!, $.single!, $.function_item!)),
			pair: ($: Symbols) => seq('(', field('left', $._choice!), ')'),
			single: ($: Symbols) => seq('<', $.a!, '>'),
			_choice: ($: Symbols) => choice($.a!, $.b!, $.c!),
			a: () => 'a',
			b: () => 'b',
			c: () => 'c',
			function_item: ($: Symbols) => seq('fn', field('parameters', $.params!)),
			params: ($: Symbols) => seq(field('item', $._param!), repeat(seq(',', field('item', $._param!)))),
			_param: ($: Symbols) => choice($.self_param!, $.param!),
			self_param: () => 'self',
			param: () => /[a-z]+/,
			...rules
		});
	const EXCEPT_B = { pair: { '1/left:': narrow.except(match('b')) } };
	const shape = (rule: unknown): unknown => JSON.parse(JSON.stringify(rule, (key, value: unknown) => (['metadata', 'annotations', 'inline'].includes(key) ? undefined : value)));

	it("narrows in place over the rules as the layer's own edits leave them, so an edit the layer made to the rule stays", async () => {
		await withDslGlobals(async () => {
			const result = layer(choices(), { edits: { ...EXCEPT_B, _choice: { '2': alias('see') } } });
			expect(layerRecordOf(result)?.diagnostics).toEqual([]);
			expect(shape(result.grammar.rules._choice)).toEqual({
				type: 'CHOICE',
				members: [
					{ type: 'SYMBOL', name: 'a' },
					{ type: 'ALIAS', content: { type: 'SYMBOL', name: 'c' }, named: true, value: 'see' }
				]
			});
		});
	});

	it("decides what its site alone reaches over the layer's own rules, so a rule the layer shares is copied", async () => {
		await withDslGlobals(async () => {
			const result = layer(choices(), { edits: EXCEPT_B, rules: { single: ($: Symbols) => seq('<', $._choice!, '>') } });
			const { rules } = result.grammar;
			expect(shape(rules._choice)).toEqual({ type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }, { type: 'SYMBOL', name: 'c' }] });
			expect(shape(rules._choice_pair)).toEqual({ type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'c' }] });
			expect(JSON.stringify(rules.pair)).toContain('"_choice_pair"');
			expect(layerRecordOf(result)?.effects).toContainEqual(
				expect.objectContaining({ kind: 'copy', copy: '_choice_pair', source: '_choice', context: 'pair', origin: { kind: 'narrow', owner: 'pair', path: '1/left:' } })
			);
		});
	});

	it('applies before the leads, so its copies come ahead of theirs', async () => {
		await withDslGlobals(async () => {
			const edits = { params: { '.': lead('item', 'receiver', match('self_param')) }, pair: { '1/left:': narrow(match('a'), match('b')) } };
			const result = layer(layer(choices(), {}), { edits });
			expect(layerRecordOf(result)?.diagnostics).toEqual([]);
			expect(Object.keys(result.grammar.rules).slice(-3)).toEqual(['_choice_pair', '_params_receiver', 'params_receiver_group']);
		});
	});

	it('records a refused narrow with its code, and drops the entry', async () => {
		await withDslGlobals(async () => {
			const plain = layer(choices(), {});
			const refused = layer(choices(), { edits: { pair: { '1/left:': narrow(match('missing')) } } });
			expect(Object.keys(refused.grammar.rules)).toEqual(Object.keys(plain.grammar.rules));
			expect(shape(refused.grammar.rules.pair)).toEqual(shape(plain.grammar.rules.pair));
			expect(layerRecordOf(refused)?.diagnostics).toEqual([
				expect.objectContaining({ code: 'narrow-invalid', severity: 'fail', ownerKind: 'pair', message: "narrow 'pair' at '1/left:': it leaves the site no arm" })
			]);
		});
	});
});

describe('an inheriting layer', () => {
	const OPTIONS = {
		gap: { separator: preference('newline') },
		pair: { 'key:/after': preference('tight') },
		_labels: { 'pair/key:/after': 'gap/separator' }
	};
	const paired = (): GrammarResult => upstream({ program: ($: Symbols) => repeat($.pair!), pair: ($: Symbols) => seq($.item!, '=', $.item!) });
	it('keeps the options its own layer wrote as written, and rewrites the options it inherits through its field entries', async () => {
		await withDslGlobals(async () => {
			const first = layer(paired(), { edits: { pair: { '0': field('key') } }, options: OPTIONS } as Config);
			const second = layer(first, { edits: { pair: { '0': field('name') } } });
			const rewritten = { gap: OPTIONS.gap, pair: { 'name:/after': OPTIONS.pair['key:/after'] }, _labels: { 'pair/name:/after': 'gap/separator' } };
			expect(layerRecordOf(first)?.records.options).toEqual(OPTIONS);
			expect(evaluatedGrammarOf(first).options).toEqual(OPTIONS);
			expect(layerRecordOf(second)?.records.options).toEqual(rewritten);
			expect(evaluatedGrammarOf(second).options).toEqual(rewritten);
		});
	});

	it('keeps the stage bases its base recorded, so the stages are those of the first layer that departs', async () => {
		await withDslGlobals(async () => {
			const first = layer(paired(), { edits: { pair: { '0': field('key') } } });
			const second = layer(first, { edits: { pair: { '0': field('name') } } });
			expect(layerRecordOf(first)?.stageBases).toBeDefined();
			expect(layerRecordOf(second)?.stageBases).toBe(layerRecordOf(first)?.stageBases);
		});
	});

	it("places a layer's render bodies after its own rules, ahead of the rules a layer above adds", async () => {
		await withDslGlobals(async () => {
			const first = layer(upstream(), { renderAs: () => ({ marker: 'm' }) } as Config);
			const second = layer(first, { rules: { extra: () => 'x' } });
			const evaluated = evaluatedGrammarOf(second);
			const synthesized = [...evaluated.evaluateSynthesized];
			expect(synthesized).toContain('marker');
			expect(Object.keys(evaluated.rules).slice(-1 - synthesized.length)).toEqual([...synthesized, 'extra']);
		});
	});

	it('records its field effects in every layer, and projects them only when it inherits a record', async () => {
		await withDslGlobals(async () => {
			const first = layer(paired(), { edits: { pair: { '0': field('key') } } });
			const second = layer(first, { edits: { pair: { '0': field('name') } } });
			expect(layerRecordOf(first)?.effects).toContainEqual({ kind: 'segment', owner: 'pair', from: 'item1:', to: 'key:' });
			expect(layerRecordOf(first)?.projections).toBeUndefined();
			expect(layerRecordOf(second)?.projections).toEqual({ splitFrom: {}, bindingEffects: [{ kind: 'segment', owner: 'pair', from: 'key:', to: 'name:' }] });
		});
	});

	it('gives a field effect to every rule that reaches its owner, stopping at a supertype', async () => {
		await withDslGlobals(async () => {
			const base = upstream({
				program: ($: Symbols) => repeat($.holder!),
				holder: ($: Symbols) => seq('[', $._kind!, ']'),
				_kind: ($: Symbols) => choice($._entry!, $.other!),
				_entry: ($: Symbols) => seq($.item!, ':', $.item!),
				other: () => 'o'
			});
			const first = layer(base, { supertypes: ($: Symbols) => [$._kind!] } as Config);
			const second = layer(first, { edits: { _entry: { '0': field('key') } } });
			expect(layerRecordOf(second)?.projections?.bindingEffects).toEqual([
				{ kind: 'segment', owner: '_kind', from: 'item:', to: 'key:' },
				{ kind: 'segment', owner: '_entry', from: 'item:', to: 'key:' }
			]);
		});
	});
});

describe('the fixture chain', () => {
	it("exposes layer 2's projections on its evaluated grammar, and none on layer 1's", async () => {
		const first = await evaluateDsl(chain('layer1.ts'));
		const second = await evaluateDsl(chain('layer2.ts'));
		expect(first).not.toHaveProperty('splitFrom');
		expect(first).not.toHaveProperty('bindingEffects');
		expect(second.splitFrom).toEqual({});
		expect(second.bindingEffects).toEqual([{ kind: 'segment', owner: 'let_statement', from: '_expression:', to: 'value:' }]);
		expect(second).not.toHaveProperty('leadFrom');
	});

	it('gives the same rules, rule order and lists from evaluate() and from the pinned CLI', async () => {
		const evaluated = await evaluateDsl(chain('layer2.ts'));
		const generated = JSON.parse(cliChain().grammarJson) as Record<string, unknown>;
		expect(Object.keys(parserRulesOf(evaluated))).toEqual(Object.keys(generated.rules as object));
		expect(ruleListNames(evaluated.extras)).toEqual(ruleListNames(generated.extras));
		expect(ruleListNames(evaluated.externals)).toEqual(ruleListNames(generated.externals));
		expect(evaluated.inline).toEqual(generated.inline);
		expect(evaluated.supertypes).toEqual(generated.supertypes);
		expect(evaluated.conflicts).toEqual(generated.conflicts);
		expect(evaluated.precedences).toEqual(generated.precedences);
		expect(evaluated.word ?? undefined).toEqual(generated.word);
	});

	it("reads layer 2's record from the result's start rule in both runtimes", async () => {
		const evaluated = await evaluateDsl(chain('layer2.ts'));
		expect(layerRecordOf({ grammar: evaluated })?.depth).toBe(2);
		expect(cliChain().events).toContain('record 2');
	});

	it('calls the externals callback before it reads the base rules', async () => {
		await withDslGlobals(async () => {
			const order: string[] = [];
			const pending = pendingBase(upstream());
			const grammar = pending.grammar;
			Object.defineProperty(pending, 'grammar', {
				value: new Proxy(grammar, {
					get(target, key, receiver) {
						if (key === 'rules') order.push('base rules');
						return Reflect.get(target, key, receiver);
					}
				})
			});
			const options = layerOptions({});
			const entry = options.externals!;
			Object.assign(options, {
				externals(this: unknown, ...args: unknown[]) {
					order.push('externals');
					return entry.apply(this, args as never);
				}
			});
			runtimeGrammar()(pending, options);
			expect(order[0]).toBe('externals');
			expect(order).toContain('base rules');
		});
	});

	it('gives equal snapshots for layer 1, then layer 2 with a reserved set, then layer 1 again', async () => {
		const first = JSON.stringify(canonical(await evaluateDsl(chain('layer1.ts'))));
		await evaluateDsl(chain('reserved-layer2.ts'));
		const again: EvaluatedGrammar = await evaluateDsl(chain('layer1.ts'));
		expect(JSON.stringify(canonical(again))).toBe(first);
		expect(again.reserved).toEqual({});
	});

	it('runs each config callback once per evaluation', async () => {
		await withDslGlobals(async () => {
			const spies = {
				rule: vi.fn((_$: unknown, previous: unknown) => previous),
				externals: vi.fn((_$: unknown, previous: unknown) => previous),
				extras: vi.fn((_$: unknown, previous: unknown) => previous),
				inline: vi.fn((_$: unknown, previous: unknown) => previous),
				supertypes: vi.fn((_$: unknown, previous: unknown) => previous),
				precedences: vi.fn((_$: unknown, previous: unknown) => previous),
				word: vi.fn(($: Record<string, unknown>) => $.item),
				reserved: vi.fn(() => ['let']),
				group: vi.fn(($: Symbols) => seq('(', $.item!, ')')),
				visibleExternals: vi.fn(() => ({ _hidden: 'h' })),
				renderAs: vi.fn(() => ({ marker: 'm' }))
			};
			layer(upstream(), {
				rules: { item: spies.rule },
				externals: spies.externals,
				extras: spies.extras,
				inline: spies.inline,
				supertypes: spies.supertypes,
				precedences: spies.precedences,
				word: spies.word,
				reserved: { global: spies.reserved },
				groups: { item_group: spies.group },
				visibleExternals: spies.visibleExternals,
				renderAs: spies.renderAs
			} as Config);
			for (const [name, spy] of Object.entries(spies)) expect(spy, name).toHaveBeenCalledTimes(1);
		});
	});

	it('never passes contexts to the runtime', async () => {
		await withDslGlobals(async () => {
			const options = layerOptions({ contexts: () => ({}) });
			expect('contexts' in options).toBe(false);
			runtimeGrammar()(pendingBase(upstream()), options);
			expect('contexts' in options).toBe(false);
		});
	});
});

describe('the grammar bindings layer', () => {
	it('enriches the completed authored layer before any binding edit', async () => {
		checks.bases.length = 0;
		const raw = await evaluateTempGrammar({ extras: '', rules: "holder: $ => seq('(', $.word, ')')" }, "edits: { holder: { 1: field('authored') } }", {
			bindings: "edits: { holder: { 1: field('portable') } }"
		});
		expect(checks.bases).toHaveLength(1);
		expect(checks.bases[0]).toContain('"name":"authored"');
		expect(checks.bases[0]).not.toContain('"name":"portable"');
		expect(JSON.stringify(raw.rules.holder)).toContain('"name":"portable"');
	});

	it('applies a lead to the field produced by the binding patch', async () => {
		const raw = await evaluateTempGrammar(
			{
				extras: '',
				rules: `holder: $ => seq('(', field('elements', $.entries), ')'),
				entries: $ => seq(field('item', choice($.head, $.tail)), repeat(seq(',', field('item', choice($.head, $.tail))))),
				head: _ => 'self', tail: _ => 'value'`
			},
			'',
			{ bindings: "edits: { entries: [{ 0: field('entry'), '1/0/1': field('entry') }, { '.': lead('entry', 'receiver', match('head')) }] }" }
		);
		expect(raw.leadFrom).toEqual({ _entries_receiver: 'entries' });
		expect(JSON.stringify(raw.rules._entries_receiver)).toContain('"name":"receiver"');
		expect(JSON.stringify(raw.rules.holder)).toContain('"value":"entries_receiver"');
		expect(JSON.stringify(raw.rules.entries)).toContain('"name":"entry"');
		expect(raw.rules).toHaveProperty('entries_receiver_group');
		expect(JSON.stringify(raw.rules._entries_receiver)).toContain('"name":"entries_receiver_group"');
	});

	it('records a hidden helper field rename against its owners before a lead narrows their helper references', async () => {
		const raw = await evaluateTempGrammar(
			{
				extras: '',
				rules: `holder: $ => seq('(', field('elements', $.entries), ')'),
			entries: $ => seq(field('item', $.parameter), repeat(seq(',', field('item', $.parameter)))),
			parameter: $ => seq($._name, ':', $.word),
			_name: $ => seq(field('pattern', choice($.head, $.tail)), '!'), head: _ => 'self', tail: _ => 'value'`
			},
			'',
			{
				bindings:
					"edits: { _name: { 0: field('name') }, entries: { '.': lead('item', 'receiver', match('parameter', { pattern: [match('head')] }, 'receiver_parameter')) } }"
			}
		);
		expect(raw.bindingEffects).toContainEqual({ kind: 'segment', owner: 'parameter', from: 'pattern:', to: 'name:' });
	});

	it.each(['rust', 'typescript', 'python'])(
		"takes %s's layer 1 as a base enrich leaves unchanged",
		async (grammar) => {
			checks.count = 0;
			const raw = await evaluatePackage(grammarPackage(grammar));
			expect(checks.count).toBeGreaterThan(0);
			expect(raw.layerDiagnostics ?? []).not.toContainEqual(expect.objectContaining({ code: 'layer-not-enrich-fixpoint' }));
		},
		240_000
	);

	it.each(['regex', 'scm'])(
		"completes %s's layer as a base enrich leaves unchanged",
		async (grammar) => {
			const evaluated = await evaluateDsl(join(packages, grammar, 'grammar.sittir.ts'));
			const record = layerRecordOf({ grammar: evaluated });
			expect(record?.depth).toBe(1);
			const { changed } = await withDslGlobals(async () => enrichFixpoint({ grammar: evaluated } as unknown as GrammarResult, record!));
			expect(changed).toEqual([]);
		},
		240_000
	);

	it('reports a layer whose base enrich would reshape, as a blocking diagnostic of that layer', async () => {
		checks.count = 0;
		const raw = await evaluateSittirGrammar(require.resolve('tree-sitter-c/grammar.js'), 'c', '', undefined, { bindings: '' });
		expect(raw.layerDiagnostics).toContainEqual(
			expect.objectContaining({
				code: 'layer-not-enrich-fixpoint',
				canProceed: false,
				message: expect.stringMatching(/enrich changes _type_declarator, generic_expression, sized_type_specifier, sized_type_specifier_arm in the layer below 'c'/)
			})
		);
		expect(checks.count).toBeGreaterThan(0);
	}, 120_000);
});
