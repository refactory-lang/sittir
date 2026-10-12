// The registry's two facts, over every corpus entry of rust, typescript and python:
//   1. what `$query().$descendants` yields at an alias envelope's index: the envelope's kind, its content's, or both;
//   2. whether a tree, an index and a role always hold one storage kind, across the routes that reach the index:
//      nested in its parent's read (role `node`, or `aliasContent` under an envelope's content key),
//      read on its own at its index (the route a query and a past-depth coordinate take), and the query's yield.
// Run from a checkout root: pnpm exec tsx docs/superpowers/probes/2026-10-09-relative-coordinates/registry-facts.mts
import { readFileSync } from 'node:fs';
import { createEngine, treeHandleOf } from '@sittir/common';
import python from '@sittir/python';
import rust from '@sittir/rust';
import typescript from '@sittir/typescript';
import { loadCorpusEntries } from '../../../../packages/tools/src/validate/common.ts';

type Role = 'node' | 'aliasContent';
type Record = { readonly $type?: unknown; readonly $_layout?: { readonly at?: { readonly $treeHandle: number } } } & { readonly [key: string]: unknown };

const INDEX_RANGE = 2 ** 32;

function envelopesOf(grammar: string): Map<number, string> {
	const transport = readFileSync(`rust/crates/sittir-${grammar}/src/render/transport.rs`, 'utf-8');
	const out = new Map<number, string>();
	for (const match of transport.matchAll(/#\[transport\(([^)]*\benvelope\b[^)]*)\)\]\s*pub struct (\w+) \{([\s\S]*?)\n\}/g)) {
		const [, attrs, name, body] = match;
		const field = /content = (\w+)/.exec(attrs!)?.[1];
		const key = field === undefined ? undefined : new RegExp(`#\\[wire\\(key = "(\\w+)"\\)\\]\\s*(?:#\\[[^\\]]*\\]\\s*)*pub ${field}:`).exec(body!)?.[1];
		const id = new RegExp(`impl ::sittir_core::options::Edged for ${name} \\{\\s*fn kind_id\\(&self\\) -> ::sittir_core::types::KindId \\{ ::sittir_core::types::KindId\\((\\d+)\\)`).exec(transport)?.[1];
		if (key === undefined || id === undefined) throw new Error(`envelope ${name}: no content key or kind id`);
		out.set(Number(id), key);
	}
	return out;
}

function isRecord(value: unknown): value is Record {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function indexOfRecord(value: Record): number | undefined {
	const handle = value.$_layout?.at?.$treeHandle;
	return handle === undefined ? undefined : handle % INDEX_RANGE;
}

for (const [grammar, descriptor] of [['rust', rust], ['typescript', typescript], ['python', python]] as const) {
	const engine = await createEngine(descriptor);
	const envelopes = envelopesOf(grammar);
	const kindName = (kind: unknown): string => (typeof kind === 'number' ? (engine.diagnostics as unknown as { kindName?: (k: number) => string }).kindName?.(kind) ?? String(kind) : String(kind));
	let entries = 0;
	let nodes = 0;
	let envelopeSites = 0;
	let standaloneReads = 0;
	let yields = 0;
	let yieldsCompared = 0;
	const yieldAtEnvelope = new Map<string, number>();
	const contentPlacement = new Map<string, number>();
	const counterexamples = new Map<string, { count: number; example: string }>();
	const note = (label: string, example: string): void => {
		const seen = counterexamples.get(label);
		if (seen === undefined) counterexamples.set(label, { count: 1, example });
		else seen.count++;
	};
	for (const entry of loadCorpusEntries(grammar)) {
		entries++;
		const { root, tree } = engine.diagnostics.parseAndRead(entry.source, { depth: Infinity }) as unknown as {
			root: Record;
			tree: { read: (index: number, depth?: number) => unknown };
		};
		const kinds = new Map<string, Set<unknown>>();
		const envelopeAt = new Map<number, { envelope: number; content: unknown }>();
		const walk = (value: unknown, role: Role): void => {
			if (Array.isArray(value)) return value.forEach((item) => walk(item, role));
			if (!isRecord(value) || typeof value.$type !== 'number') return;
			const index = indexOfRecord(value);
			const contentKey = envelopes.get(value.$type);
			if (index !== undefined) {
				nodes++;
				const key = `${index}:${role}`;
				const set = kinds.get(key) ?? new Set<unknown>();
				set.add(value.$type);
				kinds.set(key, set);
				if (contentKey !== undefined) {
					const content = value[contentKey];
					envelopeAt.set(index, { envelope: value.$type, content: isRecord(content) ? content.$type : content });
					const contentIndex = isRecord(content) ? indexOfRecord(content) : undefined;
					const placement = `${kindName(value.$type)}: ${contentIndex === undefined ? 'content holds no index' : contentIndex === index ? 'content shares the index' : 'content is its own node'}`;
					contentPlacement.set(placement, (contentPlacement.get(placement) ?? 0) + 1);
				}
			}
			for (const key of Object.keys(value)) {
				if (!key.startsWith('_') || key === '$_layout') continue;
				const child = value[key];
				const shares = contentKey !== undefined && key === contentKey && isRecord(child) && indexOfRecord(child) === index;
				walk(child, shares ? 'aliasContent' : 'node');
			}
		};
		walk(root, 'node');
		envelopeSites += envelopeAt.size;
		for (const [key, set] of kinds) {
			if (set.size > 1) note(`nested ${key.split(':')[1]}: ${[...set].map(kindName).join(' | ')}`, entry.name);
		}
		for (const [key, set] of kinds) {
			const [indexText, role] = key.split(':');
			if (role !== 'node') continue;
			const index = Number(indexText);
			const alone = tree.read(index, 1);
			standaloneReads++;
			const aloneKind = isRecord(alone) ? alone.$type : alone;
			if (!set.has(aloneKind)) note(`standalone read ≠ nested node: ${[...set].map(kindName).join(' | ')} → ${kindName(aloneKind)}`, entry.name);
		}
		const parsed = engine.parse(entry.source, { depth: 1 });
		for (const found of parsed.$query().$descendants as Iterable<unknown>) {
			if (!isRecord(found)) continue;
			const handle = treeHandleOf(found);
			if (handle === undefined) continue;
			const index = handle % INDEX_RANGE;
			yields++;
			const nested = kinds.get(`${index}:node`);
			if (nested !== undefined) yieldsCompared++;
			else note(`query yield with no nested transport at its index: ${kindName(found.$type)}`, entry.name);
			if (nested !== undefined && !nested.has(found.$type)) {
				const content = kinds.get(`${index}:aliasContent`);
				note(
					content?.has(found.$type) ? 'query yields an alias content' : `query yield ≠ nested node: ${[...nested].map(kindName).join(' | ')} → ${kindName(found.$type)}`,
					entry.name
				);
			}
			const site = envelopeAt.get(index);
			if (site !== undefined) {
				const label = found.$type === site.envelope ? 'envelope' : found.$type === site.content ? 'content' : `other (${kindName(found.$type)})`;
				yieldAtEnvelope.set(label, (yieldAtEnvelope.get(label) ?? 0) + 1);
			}
		}
	}
	console.log(`\n## ${grammar}: ${entries} entries, ${nodes} indexed transports, ${standaloneReads} standalone reads, ${yields} query yields (${yieldsCompared} compared), ${envelopeSites} envelope sites (${envelopes.size} envelope kinds)`);
	console.log(`envelope contents: ${JSON.stringify(Object.fromEntries(contentPlacement))}`);
	console.log(`finding 1, query yields at envelope sites: ${JSON.stringify(Object.fromEntries(yieldAtEnvelope))}`);
	console.log(`finding 2 (and uncompared yields), counterexamples: ${counterexamples.size === 0 ? 'none' : ''}`);
	for (const [label, { count, example }] of [...counterexamples].sort((a, b) => b[1].count - a[1].count)) {
		console.log(`  ${count}× ${label}   e.g. ${example}`);
	}
}
