import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generate } from '../../codegen/src/compiler/generate.ts';
import { AssembledEnum } from '../../codegen/src/compiler/model/node-map.ts';
import { armIsForm, armRoutesOf, buildsHost, flattenedVariantParents, formRoutesOf, seatedFormKinds, type FormRoute } from '../../codegen/src/compiler/model/ir-surface.ts';
import { findOwnKindEntry } from '../../codegen/src/dsl/symbol-table.ts';
import { collectKindEntries } from '../../codegen/src/emitters/kind-discriminant.ts';
import { isDeclaredSupertype } from '../../codegen/src/emitters/shared.ts';

type Guard = (node: unknown) => boolean;
type Tree = Record<string, unknown>;

const GRAMMARS = ['python', 'regex', 'rust', 'scm', 'typescript'] as const;

const get = (root: unknown, path: readonly string[]): unknown =>
	path.reduce<unknown>((value, key) => (value == null ? undefined : (value as Tree)[key]), root);

const nestedPathsOf = (root: Tree): Set<string> => {
	const out = new Set<string>();
	const walk = (value: Tree, path: string[]) => {
		for (const key of Object.keys(value)) {
			const child = value[key];
			if (typeof child !== 'function' && (typeof child !== 'object' || child === null)) continue;
			const next = [...path, key];
			if (next.length >= 2) out.add(next.join('.'));
			if (next.length < 8) walk(child as Tree, next);
		}
	};
	for (const key of Object.keys(root)) if (key !== 'portable') walk(root[key] as Tree, [key]);
	return out;
};

const holds = (guard: unknown, id: number): boolean => typeof guard === 'function' && (guard as Guard)({ $type: id }) === true;

let scratch = '';
beforeAll(() => {
	scratch = mkdtempSync(join(tmpdir(), 'guard-census-'));
});
afterAll(() => {
	rmSync(scratch, { recursive: true, force: true });
});

interface Census {
	readonly noSelf: string[];
	readonly enumOwnHeld: string[];
	readonly stray: string[];
	readonly twins: string[];
	readonly tokenGuards: string[];
	readonly irMissing: string[];
	readonly isMissing: string[];
	readonly isExtra: string[];
}

async function censusOf(grammar: string): Promise<Census> {
	const out = (await generate({ grammar, outputDir: join(scratch, grammar) })) as unknown as {
		nodeMap: any;
		generatedIdTables: unknown;
	};
	const nodeMap = out.nodeMap;
	const entries = collectKindEntries(nodeMap, out.generatedIdTables as never);
	const is = ((await import(`../../${grammar}/src/is.ts`)) as { is: Tree }).is;
	const ir = ((await import(`../../${grammar}/src/ir.ts`)) as { ir: Tree }).ir;
	const seated = seatedFormKinds(nodeMap);
	const readSide = [...nodeMap.nodes.values()].filter(
		(n: any) => !n.hidden && n.modelType !== 'supertype' && findOwnKindEntry(entries, n.kind) !== undefined
	) as any[];
	const selfPath = (n: any): string[] => (n.builderPath !== undefined && !seated.has(n.kind) ? n.builderPath : [n.typeKey]);
	const ownId = (n: any): number => findOwnKindEntry(entries, n.kind)!.id;

	const noSelf: string[] = [];
	const enumOwnHeld: string[] = [];
	for (const n of readSide) {
		const guard = get(is, selfPath(n));
		const label = `${n.kind}@${selfPath(n).join('.')}`;
		if (n instanceof AssembledEnum) {
			const members = n.resolvedKindIds as readonly number[];
			if (!members.every((id) => holds(guard, id))) noSelf.push(label);
			if (!members.includes(ownId(n)) && holds(guard, ownId(n))) enumOwnHeld.push(label);
		} else if (!holds(guard, ownId(n))) {
			noSelf.push(label);
		}
	}

	const flatPrimaries = new Set(readSide.map(selfPath).filter((p) => p.length === 1).map((p) => p[0]!));
	const supertypeKeys = new Set([...nodeMap.nodes.values()].filter((n: any) => isDeclaredSupertype(n)).map((n: any) => n.typeKey));
	const stray = Object.keys(is).filter((k) => k !== 'kind' && !supertypeKeys.has(k) && !flatPrimaries.has(k));
	const twins = readSide
		.filter((n) => selfPath(n).length > 1 && typeof is[n.typeKey] === 'function' && !flatPrimaries.has(n.typeKey))
		.map((n) => n.typeKey as string);

	const tokenGuards: string[] = [];
	const armKindEntries = armRoutesOf(nodeMap).kindEntries;
	for (const set of nodeMap.irSurface.armRoutes.byKind.values()) {
		const host = set.node;
		if (host.builderPath === undefined) continue;
		for (const sub of set.subs as any[]) {
			if (sub.arm.via !== 'value' || sub.depth !== 0 || sub.arm.variantOf !== host.kind || armIsForm(host, sub, armKindEntries)) continue;
			const path = [...host.builderPath, sub.name];
			if (get(is, path) !== undefined) tokenGuards.push(path.join('.'));
		}
	}

	const forms = formRoutesOf(nodeMap);
	const flat = flattenedVariantParents(nodeMap) as any[];
	const flatByKind = new Map(flat.map((p) => [p.node.kind, p]));
	const flatByKey = new Map(flat.map((p) => [p.key, p]));
	interface Hop {
		readonly name: string;
		readonly child: string;
		readonly seated: boolean;
		readonly forms?: readonly FormRoute[];
	}
	const hopsOfKind = (kind: string): Hop[] => {
		const parent = flatByKind.get(kind);
		if (parent) {
			return parent.variants.map((v: any) => ({
				name: v.name,
				child: v.nestedParentKey !== undefined ? (flatByKey.get(v.nestedParentKey) as any).node.kind : v.child.kind,
				seated: false
			}));
		}
		return (forms.get(kind) ?? []).map((r) => ({
			name: r.name,
			child: r.child.kind,
			seated: buildsHost(r),
			forms: r.forms
		}));
	};
	const hopsOfForms = (routes: readonly FormRoute[]): Hop[] =>
		routes.map((r) => ({ name: r.name, child: r.child.kind, seated: buildsHost(r), forms: r.forms }));
	const starts = new Map<string, string>();
	for (const p of flat) starts.set(p.key, p.node.kind);
	for (const kind of forms.keys()) {
		const bp = nodeMap.nodes.get(kind).builderPath as string[] | undefined;
		if (bp !== undefined) starts.set(bp.join('.'), kind);
	}
	const closure = new Set<string>();
	const visit = (hops: Hop[], path: string[]) => {
		if (path.length > 8) return;
		for (const hop of hops) {
			const next = [...path, hop.name];
			closure.add(next.join('.'));
			visit(hop.seated ? hopsOfForms(hop.forms ?? []) : hopsOfKind(hop.child), next);
		}
	};
	for (const [key, kind] of starts) visit(hopsOfKind(kind), key.split('.'));

	const irMissing = [...closure].filter((p) => get(ir, p.split('.')) === undefined).sort();
	const isMissing = [...closure].filter((p) => typeof get(is, p.split('.')) !== 'function').sort();
	const isExtra = [...nestedPathsOf(is)].filter((p) => !closure.has(p)).sort();

	return { noSelf, enumOwnHeld, stray, twins, tokenGuards, irMissing, isMissing, isExtra };
}

describe.each(GRAMMARS)('%s guard census', (grammar) => {
	let census: Census;
	beforeAll(async () => {
		census = await censusOf(grammar);
	}, 600_000);

	it('gives every read-side kind exactly one self-test at its path', () => {
		expect(census.noSelf).toEqual([]);
	});
	it('does not admit an enum kind through its own id', () => {
		expect(census.enumOwnHeld).toEqual([]);
	});
	it('leaves no flat guard without a kind behind it', () => {
		expect(census.stray).toEqual([]);
	});
	it('gives no read-side kind a second twin self-test', () => {
		expect(census.twins).toEqual([]);
	});
	it('answers no token-choice value route with an is guard', () => {
		expect(census.tokenGuards).toEqual([]);
	});
	it('guards every ir form route at the same path', () => {
		expect(census.isMissing).toEqual([]);
	});
	it('guards no nested path the ir surface does not build', () => {
		expect(census.isExtra).toEqual([]);
	});
	it('builds every form route an is guard names', () => {
		expect(census.irMissing).toEqual([]);
	});
});
