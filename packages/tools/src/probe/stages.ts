/**
 * probe/stages — dump a single rule's shape at every compiler phase.
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
 *   - `normalize`       — after `normalizeGrammar()` (rule canonicalisation).
 *   - `simplify`        — `normalized.simplifiedRules[kind]`, the
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

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { resolveGrammarJsPath } from '../../../codegen/src/compiler/resolve-grammar.ts';
import { evaluate } from '../../../codegen/src/compiler/evaluate.ts';
import { link } from '../../../codegen/src/compiler/link.ts';
import { normalizeGrammar } from '../../../codegen/src/compiler/normalize.ts';
import { assemble, AssembleCtx, hydrateSlotRefs } from '../../../codegen/src/compiler/assemble.ts';
import { loadGeneratedIdTables } from '../../../codegen/src/compiler/generated-metadata.ts';
import { emitTypes } from '../../../codegen/src/emitters/types.ts';
import { runTemplateEmitter } from '../../../codegen/src/emitters/templates.ts';

export interface ProbeStagesOptions {
grammar: string;
kind: string;
noOverrides: boolean;
compact: boolean;
skipEmit: boolean;
brief: boolean;
}

export async function run(opts: ProbeStagesOptions): Promise<number> {
const grammar = opts.grammar;
const kind = opts.kind;
const repoRoot = resolve(new URL('../../../..', import.meta.url).pathname);

const overridesPath = resolve(repoRoot, `packages/${grammar}/overrides.ts`);
const grammarJsPath = resolveGrammarJsPath(grammar);
const useOverrides = !opts.noOverrides && existsSync(overridesPath);
const entryPath = useOverrides ? overridesPath : grammarJsPath;

const stages: Record<string, unknown> = {
grammar,
kind,
entryPath: relFromRoot(entryPath, repoRoot)
};

const origLog = console.log;
const origWarn = console.warn;
console.log = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');
console.warn = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');

const raw = await evaluate(entryPath);
stages.evaluate = raw.rules[kind] ?? null;

const linked = link(raw, undefined);
stages.link = linked.rules[kind] ?? null;

const normalized = normalizeGrammar(linked);
stages.normalize = normalized.linkRules[kind] ?? null;
stages.simplify = normalized.simplifiedRules?.[kind] ?? null;

const nodeMap = assemble(AssembleCtx.from(normalized));
const node = nodeMap.nodes.get(kind) ?? null;
stages.assemble = node ? summarizeAssembled(node) : null;
const generatedIdTables = await loadGeneratedIdTables(grammar);

if (!opts.skipEmit) {
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

const indent = opts.compact ? undefined : 2;
const payload = opts.brief
? { grammar: stages.grammar, kind: stages.kind, simplify: stages.simplify }
: stages;
process.stdout.write(JSON.stringify(decycle(payload), null, indent) + '\n');
return 0;
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
