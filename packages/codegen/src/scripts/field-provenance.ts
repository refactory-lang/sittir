/**
 * field-provenance — dump every FIELD in a generated grammar.json with
 * its source tag so override-vs-enrich redundancies jump out.
 *
 * ## Usage
 *
 * ```sh
 * npx tsx packages/codegen/src/scripts/field-provenance.ts --grammar rust
 * npx tsx packages/codegen/src/scripts/field-provenance.ts --grammar rust --kind block
 * npx tsx packages/codegen/src/scripts/field-provenance.ts --grammar rust --redundant
 * ```
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
 *
 * `--redundant`: only print flagged rows — compact actionable list.
 *
 * `--kind <K>`: filter to a single rule.
 *
 * ## Why
 *
 * Enrich now applies pass 1 / 2 / 3 and stamps `source: 'enriched'`
 * on every FIELD it introduces. Override patches stamp `'override'`.
 * When an override wraps the same position enrich would wrap, the two
 * stack (override outside, enriched inside) — visible here as
 * `REDUNDANT_NESTED` and removable from the override file.
 */

import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

function isField(
	node: unknown,
): node is { type: string; name: string; content: unknown; source?: string } {
	return !!node && typeof node === "object" && (node as { type?: unknown }).type === "FIELD";
}

function collectFieldsInSubtree(node: unknown, out: Set<string>): void {
	if (!node || typeof node !== "object") return;
	const n = node as { type?: string; name?: string; content?: unknown; members?: unknown[] };
	if (n.type === "FIELD" && typeof n.name === "string") out.add(n.name);
	if (n.content !== undefined) collectFieldsInSubtree(n.content, out);
	if (Array.isArray(n.members)) {
		for (const m of n.members) collectFieldsInSubtree(m, out);
	}
}

function walkRule(kind: string, node: unknown, path: string[], rows: FieldRow[]): void {
	if (!node || typeof node !== "object") return;
	if (isField(node)) {
		const innerFieldNames = new Set<string>();
		collectFieldsInSubtree(node.content, innerFieldNames);
		rows.push({
			kind,
			path: path.join("/") || "(root)",
			name: node.name,
			source: node.source ?? "grammar",
			redundantNested: innerFieldNames.has(node.name),
		});
	}
	const n = node as { content?: unknown; members?: unknown[] };
	if (n.content !== undefined) {
		walkRule(kind, n.content, [...path, "content"], rows);
	}
	if (Array.isArray(n.members)) {
		n.members.forEach((m, i) => walkRule(kind, m, [...path, String(i)], rows));
	}
}

function main(): void {
	const { values } = parseArgs({
		options: {
			grammar: { type: "string" },
			kind: { type: "string" },
			redundant: { type: "boolean", default: false },
			source: { type: "string" },
		},
	});

	const grammar = values.grammar;
	if (!grammar) {
		process.stderr.write(
			"Usage: field-provenance.ts --grammar <name> [--kind K] [--redundant] [--source override|enriched|grammar|inferred]\n",
		);
		process.exit(1);
	}

	const gjPath = resolve(
		new URL("../../../..", import.meta.url).pathname,
		`packages/${grammar}/.sittir/src/grammar.json`,
	);
	const gj = JSON.parse(readFileSync(gjPath, "utf-8")) as GrammarJson;

	const rows: FieldRow[] = [];
	for (const [kind, rule] of Object.entries(gj.rules)) {
		if (values.kind && kind !== values.kind) continue;
		walkRule(kind, rule, [], rows);
	}

	let filtered = rows;
	if (values.redundant) filtered = filtered.filter((r) => r.redundantNested);
	if (values.source) filtered = filtered.filter((r) => r.source === values.source);

	// Stats summary on stderr.
	const bySource = new Map<string, number>();
	for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);
	const redundantCount = rows.filter((r) => r.redundantNested).length;
	process.stderr.write(`# grammar: ${grammar}\n`);
	process.stderr.write(`# total FIELDs: ${rows.length}\n`);
	for (const [src, n] of [...bySource].sort()) process.stderr.write(`#   ${src.padEnd(10)} ${n}\n`);
	process.stderr.write(`# redundant-nested: ${redundantCount}\n`);
	process.stderr.write("\n");

	// Header + rows to stdout.
	process.stdout.write(["kind", "path", "name", "source", "flag"].join("\t") + "\n");
	for (const r of filtered) {
		const flag = r.redundantNested ? "REDUNDANT_NESTED" : "";
		process.stdout.write([r.kind, r.path, r.name, r.source, flag].join("\t") + "\n");
	}
}

main();
