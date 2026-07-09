/**
 * field-provenance — dump every FIELD in a generated grammar.json with
 * its source tag so override-vs-enrich redundancies jump out.
 *
 * ## Output
 *
 * Default mode — one line per FIELD, TSV:
 *
 *     kind               path             name               source
 *     block              0                label              override    REDUNDANT_NESTED
 *     block              0/content/0/0    label              enriched
 *     break_expression   1                label              enriched
 *     ...
 *
 * `REDUNDANT_NESTED` is attached when a FIELD contains (at any depth
 * inside its content) another FIELD with the same name — the outer
 * one is most likely an override that duplicates an enrich promotion.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readRuleMetadata } from '../../../codegen/src/dsl/rule-metadata.ts';

export interface FieldProvenanceOptions {
	grammar: string;
	kind?: string;
	redundant: boolean;
	source?: string;
}

interface FieldRow {
	kind: string;
	path: string;
	name: string;
	source: string;
	redundantNested: boolean;
}

interface GrammarJson {
	rules: Record<string, unknown>;
}

/**
 * (debt PR-P1) `FIELD.source` is gone from the emitted `grammar.json`
 * shape too — tree-sitter round-trips whatever `overrides.ts` produced,
 * and sittir's field-rule provenance now lives in `metadata.fieldSource`
 * (opaque to the compiler; this diagnostics tool is a sanctioned reader of
 * the real shape via `dsl/rule-metadata.ts`'s `readRuleMetadata`). Grammar
 * JSON's `metadata` here is the same plain object that `makeRuleMetadata`
 * constructs, round-tripped through JSON — `readRuleMetadata` still works
 * on it since the brand is type-level only (erased at runtime).
 */
function isField(node: unknown): node is { type: string; name: string; content: unknown; metadata?: unknown } {
	return !!node && typeof node === 'object' && (node as { type?: unknown }).type === 'FIELD';
}

function collectFieldsInSubtree(node: unknown, out: Set<string>): void {
	if (!node || typeof node !== 'object') return;
	const n = node as {
		type?: string;
		name?: string;
		content?: unknown;
		members?: unknown[];
	};
	if (n.type === 'FIELD' && typeof n.name === 'string') out.add(n.name);
	if (n.content !== undefined) collectFieldsInSubtree(n.content, out);
	if (Array.isArray(n.members)) {
		for (const m of n.members) collectFieldsInSubtree(m, out);
	}
}

function walkRule(kind: string, node: unknown, path: string[], rows: FieldRow[]): void {
	if (!node || typeof node !== 'object') return;
	if (isField(node)) {
		const innerFieldNames = new Set<string>();
		collectFieldsInSubtree(node.content, innerFieldNames);
		rows.push({
			kind,
			path: path.join('/') || '(root)',
			name: node.name,
			source: readRuleMetadata(node.metadata)?.fieldSource ?? 'grammar',
			redundantNested: innerFieldNames.has(node.name)
		});
	}
	const n = node as { content?: unknown; members?: unknown[] };
	if (n.content !== undefined) {
		walkRule(kind, n.content, [...path, 'content'], rows);
	}
	if (Array.isArray(n.members)) {
		n.members.forEach((m, i) => walkRule(kind, m, [...path, String(i)], rows));
	}
}

export async function run(opts: FieldProvenanceOptions): Promise<number> {
	const gjPath = resolve(
		new URL('../../../..', import.meta.url).pathname,
		`packages/${opts.grammar}/.sittir/src/grammar.json`
	);
	const gj = JSON.parse(readFileSync(gjPath, 'utf-8')) as GrammarJson;

	const rows: FieldRow[] = [];
	for (const [kind, rule] of Object.entries(gj.rules)) {
		if (opts.kind && kind !== opts.kind) continue;
		walkRule(kind, rule, [], rows);
	}

	let filtered = rows;
	if (opts.redundant) filtered = filtered.filter((r) => r.redundantNested);
	if (opts.source) filtered = filtered.filter((r) => r.source === opts.source);

	const bySource = new Map<string, number>();
	for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);
	const redundantCount = rows.filter((r) => r.redundantNested).length;
	process.stderr.write(`# grammar: ${opts.grammar}\n`);
	process.stderr.write(`# total FIELDs: ${rows.length}\n`);
	for (const [src, n] of [...bySource].sort()) process.stderr.write(`#   ${src.padEnd(10)} ${n}\n`);
	process.stderr.write(`# redundant-nested: ${redundantCount}\n`);
	process.stderr.write('\n');

	process.stdout.write(['kind', 'path', 'name', 'source', 'flag'].join('\t') + '\n');
	for (const r of filtered) {
		const flag = r.redundantNested ? 'REDUNDANT_NESTED' : '';
		process.stdout.write([r.kind, r.path, r.name, r.source, flag].join('\t') + '\n');
	}
	return 0;
}
