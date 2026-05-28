/**
 * probe-stages — dump a single rule's shape at every compiler phase.
 *
 * ## Usage
 *
 * ```sh
 * npx tsx packages/codegen/src/scripts/probe-stages.ts --grammar rust --kind block
 * npx tsx packages/codegen/src/scripts/probe-stages.ts --grammar rust --kind break_expression --compact
 * npx tsx packages/codegen/src/scripts/probe-stages.ts --grammar rust --kind block --no-overrides --kind block
 * ```
 *
 * ## Output
 *
 * JSON with one key per pipeline phase:
 *
 *   - `evaluate`        — rule tree as the runtime sees it after
 *                         `enrich(base)` + `wire(transforms/polymorphs)` fold
 *                         into `grammar()`. Every FIELD carries a `source`
 *                         tag (`'grammar' | 'enriched' | 'override' |
 *                         'inferred'`) so override-vs-enrich
 *                         redundancies surface as nested same-name FIELDs.
 *   - `link`            — after `link()` (symbol-reference inference,
 *                         promoted rules).
 *   - `optimize`        — after `optimize()` (rule canonicalisation).
 *   - `simplify`        — `optimized.simplifiedRules[kind]`, the
 *                         template-walker's view of the same rule with
 *                         decorative wrappers stripped.
 *   - `assemble`        — the `AssembledNode` for this kind (fields,
 *                         children, polymorph forms, irKey, etc.).
 *   - `emit.interface`  — emitted TypeScript interface shape for the
 *                         kind (from `emitTypes`).
 *   - `emit.template`   — emitted Jinja template body (from
 *                         `runTemplateEmitter`).
 *
 * With `--no-overrides`, evaluates the base tree-sitter grammar.js
 * directly (skipping `overrides.ts`). Useful for seeing what
 * enrich vs overrides are each contributing.
 *
 * ## Why
 *
 * Complements `probe-kind` (which is source-driven parse→render).
 * probe-stages is shape-driven — given a rule name, shows how the
 * rule's body transforms through the compiler. Surfaces:
 *
 *   1. Override entries that enrich would cover (nested same-name
 *      FIELDs with `source: 'override'` outside, `'enriched'` inside).
 *   2. Where a FIELD's name gets rewritten across stages.
 *   3. Polymorph splits and variant promotions.
 *   4. Simplify's stripping decisions.
 *   5. Assemble's field→slot mapping.
 */

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromHere = createRequire(import.meta.url);
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { assemble, hydrateSlotRefs } from '../compiler/assemble.ts';
import { loadGeneratedIdTables } from '../compiler/generated-metadata.ts';
import { emitTypes } from '../emitters/types.ts';
import { runTemplateEmitter } from '../emitters/templates.ts';

async function main(argv: string[]): Promise<number> {
	const { values } = parseArgs({
		args: argv,
		options: {
			grammar: { type: 'string', short: 'g' },
			kind: { type: 'string', short: 'k' },
			'no-overrides': { type: 'boolean', default: false },
			compact: { type: 'boolean', default: false },
			'skip-emit': { type: 'boolean', default: false },
			brief: { type: 'boolean', default: false }
		}
	});
	const grammar = values.grammar as string | undefined;
	const kind = values.kind as string | undefined;
	if (!grammar || !kind) {
		process.stderr.write(
			'Usage: probe-stages.ts --grammar <name> --kind <kind> [--no-overrides] [--compact] [--skip-emit] [--brief]\n'
		);
		return 1;
	}

	const repoRoot = resolve(new URL('../../../..', import.meta.url).pathname);

	// Pick entry point: grammar.js when --no-overrides, else overrides.ts.
	const overridesPath = resolve(repoRoot, `packages/${grammar}/overrides.ts`);
	const grammarJsPath = resolveGrammarJsPath(grammar);
	const useOverrides = !values['no-overrides'] && existsSync(overridesPath);
	const entryPath = useOverrides ? overridesPath : grammarJsPath;

	const stages: Record<string, unknown> = {
		grammar,
		kind,
		entryPath: relFromRoot(entryPath, repoRoot)
	};

	// Phase passes log diagnostics (enrich/transform/[assemble]) via
	// console.log/warn; route them to stderr so stdout carries only the JSON.
	const origLog = console.log;
	const origWarn = console.warn;
	console.log = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');
	console.warn = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');

	// Phase 1: evaluate.
	const raw = await evaluate(entryPath);
	stages.evaluate = raw.rules[kind] ?? null;

	// Phase 2: link.
	const linked = link(raw, undefined);
	stages.link = linked.rules[kind] ?? null;

	// Phase 3: optimize.
	const optimized = optimize(linked);
	stages.optimize = optimized.rules[kind] ?? null;
	stages.simplify = optimized.simplifiedRules?.[kind] ?? null;

	// Phase 4: assemble.
	const nodeMap = assemble(optimized);
	const node = nodeMap.nodes.get(kind) ?? null;
	stages.assemble = node ? summarizeAssembled(node) : null;
	const generatedIdTables = await loadGeneratedIdTables(grammar);

	// Phase 5: emit (optional — heavy). Hydrate ON-DEMAND right before
	// emit so the assemble dump above shows raw slot refs (which is what
	// the consumer of probe-stages typically wants to see).
	if (!values['skip-emit']) {
		hydrateSlotRefs(nodeMap);
		try {
			const types = emitTypes({ grammar, nodeMap, generatedIdTables });
			const ifacePat = new RegExp(`export interface ${kindToPascal(kind)}[^\\{]*\\{[\\s\\S]*?\\n\\}`, 'm');
			const m = (types as unknown as string).match(ifacePat);
			stages.emitInterface = m ? m[0] : null;
		} catch (e) {
			stages.emitInterface = { error: String((e as Error).message ?? e) };
		}
		try {
			const tpl = runTemplateEmitter({ grammar, nodeMap });
			const body = tpl.bodies.get(kind);
			stages.emitTemplate = body ?? null;
		} catch (e) {
			stages.emitTemplate = { error: String((e as Error).message ?? e) };
		}
	}

	console.log = origLog;
	console.warn = origWarn;

	const indent = values.compact ? undefined : 2;
	const payload = values.brief
		? { grammar: stages.grammar, kind: stages.kind, simplify: stages.simplify }
		: stages;
	process.stdout.write(JSON.stringify(decycle(payload), null, indent) + '\n');
	return 0;
}

/** Run the probe-stages CLI with the given argv (excluding node/script path). */
export async function run(argv: string[]): Promise<number> {
	return main(argv);
}

function resolveGrammarJsPath(grammar: string): string {
	const candidates = [`tree-sitter-${grammar}/grammar.js`, `tree-sitter-${grammar}/common/define-grammar.js`];
	for (const c of candidates) {
		try {
			return requireFromHere.resolve(c);
		} catch {
			/* try next */
		}
	}
	throw new Error(`probe-stages: could not resolve base grammar.js for '${grammar}'`);
}

function relFromRoot(p: string, root: string): string {
	return p.startsWith(root) ? p.slice(root.length + 1) : p;
}

function kindToPascal(kind: string): string {
	return kind
		.replace(/^_+/, '')
		.split('_')
		.map((s) => (s.length ? s[0]!.toUpperCase() + s.slice(1) : s))
		.join('');
}

/**
 * Assembled nodes are rich class instances with cyclic object refs.
 * Extract the fields a shape-level diff cares about and drop the rest.
 */
function summarizeAssembled(node: unknown): unknown {
	const n = node as {
		kind?: string;
		modelType?: string;
		irKey?: string;
		projection?: unknown;
		fields?: unknown;
		children?: unknown;
		forms?: unknown;
		polymorphForms?: unknown;
		isParameterless?: boolean;
		parameterlessReason?: string;
	};
	const fields = summarizeMapLike(n.fields, (v) => ({
		source: (v as { source?: string }).source,
		values: summarizeValues((v as { values?: unknown }).values)
	}));
	const children = summarizeMapLike(n.children, (v) => ({
		values: summarizeValues((v as { values?: unknown }).values)
	}));
	const forms = summarizeMapLike(n.forms, () => ({}));
	return {
		kind: n.kind,
		modelType: n.modelType,
		irKey: n.irKey,
		isParameterless: n.isParameterless,
		parameterlessReason: n.parameterlessReason,
		fields,
		children,
		forms
	};
}

function summarizeMapLike(
	v: unknown,
	proj: (value: unknown) => Record<string, unknown>
): Array<Record<string, unknown>> {
	if (!v) return [];
	if (v instanceof Map) {
		return [...v.entries()].map(([k, val]) => ({ name: k, ...proj(val) }));
	}
	if (Array.isArray(v)) {
		return v.map((item) => {
			const it = item as { name?: string };
			return { name: it.name, ...proj(item) };
		});
	}
	if (typeof v === 'object') {
		return Object.entries(v as Record<string, unknown>).map(([k, val]) => ({
			name: k,
			...proj(val)
		}));
	}
	return [];
}

function summarizeValues(v: unknown): unknown {
	if (!Array.isArray(v)) return v;
	return v.map((x) => {
		if (typeof x === 'string') return { string: x };
		const o = x as { kind?: string; name?: string };
		if (o && typeof o === 'object' && 'name' in o) {
			return { node: o.name, kind: o.kind };
		}
		return x;
	});
}

/**
 * Deep-clone `value`, replacing back-pointer CYCLES with a marker so the result
 * is JSON-safe. Tracks ancestors (add on descent, remove on ascent), so only
 * true cycles are pruned — shared (non-cyclic) refs are preserved. Linked rules
 * + AssembledNode instances carry such cycles (e.g. `AssembledBranch._slots →
 * … → node`), which crashed `JSON.stringify` outright.
 */
function decycle(value: unknown, ancestors: Set<object> = new Set()): unknown {
	if (value === null || typeof value !== 'object') return value;
	const obj = value as object;
	if (ancestors.has(obj)) return '[Circular]';
	ancestors.add(obj);
	let out: unknown;
	if (Array.isArray(value)) {
		out = value.map((v) => decycle(v, ancestors));
	} else {
		const rec: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			rec[k] = decycle(v, ancestors);
		}
		out = rec;
	}
	ancestors.delete(obj);
	return out;
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((e) => {
		process.stderr.write(`probe-stages: ${(e as Error).stack ?? e}\n`);
		process.exit(1);
	});
}
