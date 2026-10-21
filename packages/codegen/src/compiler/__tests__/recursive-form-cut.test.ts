import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from './_temp-grammar.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { armIsForm, armRoutesOf, formRoutesOf, stampIrSurface } from '../model/ir-surface.ts';
import { emitIs } from '../../emitters/is.ts';

const direct = {
	extras: '/\\s/',
	rules: "source: ($) => repeat($.group), group: ($) => seq('(', choice($.group, $.identifier), ')'), identifier: () => /[a-z]+/"
};
const mutual = {
	extras: '/\\s/',
	rules: "source: ($) => repeat(choice($.a, $.b)), a: ($) => seq('(', choice($.b, $.x), ')'), b: ($) => seq('[', choice($.a, $.x), ']'), x: () => /x/"
};

const modelOf = async (upstream: unknown) => {
	const raw = await evaluateTempGrammar(upstream as never, '');
	const nodeMap = assemble(AssembleCtx.from(normalizeGrammar(link(raw))));
	stampIrSurface(nodeMap as never);
	return nodeMap;
};

describe('a recursive form is cut once and still emits', () => {
	it.each([
		['direct', direct],
		['mutual', mutual]
	])('%s recursion: emits is.ts without throwing', async (_label, upstream) => {
		const nodeMap = await modelOf(upstream);
		expect(emitIs({ grammar: 'synth', nodeMap } as never).length).toBeGreaterThan(0);
	});

	it.each([
		['direct', direct],
		['mutual', mutual]
	])('%s: the form tree joined with $ is exactly the settled form paths', async (_label, upstream) => {
		const nodeMap = await modelOf(upstream);
		const arms = armRoutesOf(nodeMap);
		const subsOf = (kind: string) => arms.byKind.get(kind);
		type Route = { name: string; child: { kind: string }; forms?: readonly Route[] };
		const routesOf = (kind: string): readonly Route[] => (formRoutesOf(nodeMap).get(kind) ?? []) as readonly Route[];
		const treePaths = (routes: readonly Route[], prefix: string[] = []): string[] =>
			routes.flatMap((route) => {
				const path = [...prefix, route.name];
				return [path.join('$'), ...treePaths(route.forms ?? [], path)];
			});
		const isFormPath = (kind: string, steps: readonly string[]): boolean => {
			const set = subsOf(kind);
			const sub = set?.subs.find((candidate: { name: string }) => candidate.name === steps[0]);
			if (set === undefined || sub === undefined || !armIsForm(set.node, sub, arms.kindEntries)) return false;
			if (steps.length === 1) return true;
			const route = routesOf(kind).find((candidate) => candidate.name === steps[0]);
			return route !== undefined && isFormPath(route.child.kind, steps.slice(1));
		};
		for (const host of formRoutesOf(nodeMap).keys()) {
			const settled = (subsOf(host)?.subs ?? []).map((sub: { name: string }) => sub.name);
			const paths = treePaths(routesOf(host));
			for (const path of paths) expect(settled, path).toContain(path);
			const formEntries = settled.filter((name: string) => isFormPath(host, name.split('$')));
			for (const entry of formEntries) expect(paths, `${host}: ${entry}`).toContain(entry);
		}
	});

	it('nests a seated route under its own host only as far as the host settles', async () => {
		const nodeMap = await modelOf(mutual);
		const aForms = formRoutesOf(nodeMap).get('a') ?? [];
		const b = aForms.find((route) => route.name === 'b');
		expect(b?.forms?.map((route) => route.name)).toEqual(['a', 'x']);
	});
});
