import type { AnyUntypedNode } from '@sittir/types';
import { isLive, type EngineHandle, type LiveEngine } from './engine-scope.ts';
import { applyHost } from './reparse.ts';
import { enterPath, Leave } from './node-data.ts';
import { storedSlotValues } from './record-view.ts';
import { isNode, nodeText, spanOf } from './utils.ts';

export interface DelimitedSpec {
	readonly kind: string;
	readonly id: number;
	readonly excluded: RegExp;
	readonly open?: string;
	readonly close?: string;
	readonly host: string;
	readonly nodeKinds: readonly number[];
}

interface Parsed {
	readonly $errors: readonly unknown[];
	readonly $trivia?: { inner?: () => readonly Spanned[] };
}

interface Spanned {
	readonly $type: number;
}

type Facet = { readonly $descendants: { ofType(kind: number): Iterable<Spanned> }; readonly $children: Iterable<Spanned> };

const pairings = new WeakMap<DelimitedSpec, Set<string>>();


function leafTexts(value: unknown, skip: ReadonlySet<number>, into: string[]): string[] {
	const work: unknown[] = [value];
	const path = new Set<object>();
	const pushReversed = (items: readonly unknown[]): void => {
		for (let at = items.length - 1; at >= 0; at -= 1) work.push(items[at]);
	};
	while (work.length > 0) {
		const next = work.pop();
		if (next instanceof Leave) {
			path.delete(next.value);
			continue;
		}
		if (next === undefined || next === null) continue;
		if (typeof next === 'object') {
			enterPath(path, next);
			work.push(new Leave(next));
		}
		if (typeof next === 'object' && !isNode(next) && Symbol.iterator in next) {
			pushReversed([...(next as Iterable<unknown>)]);
			continue;
		}
		const node = next as Record<string, unknown>;
		if (typeof node.$type === 'number' && skip.has(node.$type)) continue;
		const text = nodeText(node);
		if (text !== undefined) into.push(text);
		else if (typeof next === 'object') pushReversed(storedSlotValues(next).map(([, child]) => child));
	}
	return into;
}

function kindsOf(values: readonly unknown[], keep: ReadonlySet<number>): number[] {
	return values.flat().flatMap((value) => {
		const kind = (value as { $type?: unknown } | null)?.$type;
		return typeof kind === 'number' && keep.has(kind) ? [kind] : [];
	});
}

function parseBack(
	engine: LiveEngine & { parse(source: string): Parsed },
	spec: DelimitedSpec,
	text: string,
	expectedKinds: readonly number[]
): string | undefined {
	const hosted = applyHost(spec.host, text);
	const root = engine.parse(hosted.text);
	if (root.$errors.length > 0) return 'it does not parse';
	const facet = engine.query(root) as Facet;
	const candidates = [...facet.$descendants.ofType(spec.id), ...(root.$trivia?.inner?.() ?? []).filter((node) => node.$type === spec.id)];
	const found = candidates.flatMap((node) => {
		const span = spanOf(node);
		return span?.start === hosted.offset ? [{ node, span }] : [];
	})[0];
	if (found === undefined) return `no ${spec.kind} starts where it was rendered`;
	const end = found.span.end;
	if (end !== hosted.offset + text.length) return `the ${spec.kind} ends early, at ${end - hosted.offset}`;
	if (spec.nodeKinds.length === 0) return undefined;
	const keep = new Set(spec.nodeKinds);
	const actual = [...(engine.query(found.node) as Facet).$children].map((child) => child.$type).filter((kind) => keep.has(kind));
	return actual.join() === expectedKinds.join() ? undefined : 'its children change';
}

function refusal(spec: DelimitedSpec, content: string, open: string, close: string, why: string): Error {
	return new Error(
		`${spec.kind}: content ${JSON.stringify(content)} cannot sit between ${JSON.stringify(open)} and ${JSON.stringify(close)}: ${why}`
	);
}

/**
 * Refuses a delimited composite whose content would not read back inside its own delimiters.
 *
 * Content free of the characters that can end or reshape the composite is accepted on its own;
 * anything else, and every delimiter pair of a kind whose delimiters vary, is parsed back through
 * the engine in scope. Without an engine a varying pair is always refused, and fixed delimiters
 * with clean content pass.
 */
export function checkDelimited(
	handle: EngineHandle | undefined,
	node: object,
	spec: DelimitedSpec,
	content: readonly unknown[],
	open?: unknown,
	close?: unknown
): void {
	const openText = spec.open ?? nodeText(open) ?? '';
	const closeText = spec.close ?? nodeText(close) ?? '';
	const skip = new Set(spec.nodeKinds);
	const texts = content.flatMap((value) => leafTexts(value, skip, []));
	const clean = texts.every((text) => !spec.excluded.test(text));
	const engine = handle !== undefined && isLive(handle.current) ? (handle.current as LiveEngine & { parse(source: string): Parsed }) : undefined;
	const body = texts.join('');
	const varying = spec.open === undefined || spec.close === undefined;
	if (varying) {
		if (engine === undefined) throw refusal(spec, body, openText, closeText, 'its delimiters need an engine to be checked');
		const confirmed = pairings.get(spec) ?? new Set<string>();
		pairings.set(spec, confirmed);
		const pairKey = `${openText}\u0000${closeText}`;
		if (!confirmed.has(pairKey)) {
			const why = parseBack(engine, spec, openText + closeText, []);
			if (why !== undefined) throw refusal(spec, body, openText, closeText, `the delimiters do not pair: ${why}`);
			confirmed.add(pairKey);
		}
	}
	if (clean) return;
	if (engine === undefined) throw refusal(spec, body, openText, closeText, 'this content needs an engine to be checked');
	const keep = new Set(spec.nodeKinds);
	const nodes = kindsOf(content, keep);
	const text = nodes.length === 0 ? openText + body + closeText : engine.render(node as AnyUntypedNode).toString();
	const why = parseBack(engine, spec, text, nodes);
	if (why !== undefined) throw refusal(spec, body, openText, closeText, why);
}
