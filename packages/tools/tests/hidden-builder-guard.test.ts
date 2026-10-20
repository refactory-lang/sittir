import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { compileGrammar } from '../../codegen/src/compiler/compile.ts';
import { loadGeneratedIdTables } from '../../codegen/src/compiler/generated-metadata.ts';
import { grammarPackage, type GrammarName } from '../../codegen/src/grammars.ts';
import { loadNodeModel } from '../src/validate/common.ts';
import python from '../../python/src/index.ts';
import regex from '../../regex/src/index.ts';
import rust from '../../rust/src/index.ts';
import scm from '../../scm/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const ENGINES = {
	python: () => createEngine(python),
	regex: () => createEngine(regex),
	rust: () => createEngine(rust),
	scm: () => createEngine(scm),
	typescript: () => createEngine(typescript)
} as const;

// A kind is never a node when the parser never shows it: it is hidden on the surface, is not a
// supertype, and no named alias in a parent rule uses it as content, so no alias site gives it a CST
// node. A builder for such a kind is a builder for nothing the parser produces, so there must be none.
// Builders at alias sites stay, since their kinds are real nodes.
type Compilation = Awaited<ReturnType<typeof compileGrammar>>;

async function compileOf(grammar: keyof typeof ENGINES): Promise<Compilation> {
	return compileGrammar({
		package: grammarPackage(grammar as GrammarName),
		generatedIdTables: await loadGeneratedIdTables(grammar)
	});
}

const neverNodeOf = (compilation: Compilation) => (kind: string): boolean => {
	const node = compilation.nodeMap.nodes.get(kind);
	return node !== undefined && node.surfaceHidden === true && node.modelType !== 'supertype' && !compilation.linked.parentAliasedKinds?.has(kind);
};

async function neverNodeBuilders(grammar: keyof typeof ENGINES): Promise<string[]> {
	const engine = await ENGINES[grammar]();
	const { builderPaths } = await loadNodeModel(grammar);
	const neverNode = neverNodeOf(await compileOf(grammar));
	const offending: string[] = [];
	for (const [kind, path] of Object.entries(builderPaths)) {
		const builder = path.reduce<unknown>((at, segment) => (at as Record<string, unknown> | undefined)?.[segment], engine.build);
		if (typeof builder === 'function' && neverNode(kind)) offending.push(`${path.join('.')} (kind ${kind})`);
	}
	return offending;
}

// Every planned route the emitters build from must build a kind the parser shows as a node.
function routeOffences(compilation: Compilation): string[] {
	const surface = compilation.nodeMap.irSurface;
	if (surface === undefined) throw new Error('the node map carries no IR surface');
	const neverNode = neverNodeOf(compilation);
	const offences: string[] = [];
	const see = (route: string, node: { readonly kind: string } | undefined): void => {
		if (node !== undefined && neverNode(node.kind)) offences.push(`${route} -> ${node.kind}`);
	};
	for (const set of surface.armRoutes.byKind.values()) {
		for (const sub of set.subs) {
			if (sub.arm.via !== 'node') continue;
			see(`${set.parentKey}.${sub.name} (arm child)`, sub.arm.child);
			see(`${set.parentKey}.${sub.name} (arm leaf)`, sub.arm.leaf);
		}
	}
	for (const parent of surface.flattened) {
		for (const variant of parent.variants) see(`${parent.key}.${variant.name} (variant)`, variant.child);
	}
	for (const group of surface.plan.groups) {
		for (const member of group.members) see(`${group.key}.${member.key} (group member)`, member.node);
	}
	for (const list of [surface.plan.bundles, surface.plan.keywords, surface.plan.ownText, surface.plan.patterns]) {
		for (const member of list) see(`${member.key} (plan member)`, member.node);
	}
	for (const parent of surface.plan.variantParents) see(`${parent.key} (variant parent)`, parent.node);
	return offences;
}

// Every callable reachable from a build table: a path for each function, recursing into namespace objects
// and into a callable's own enumerable members (its strict and coerce forms, nested routes). The table is
// the engine's own, so a function is recorded under every path it is reached by.
function callablePaths(root: unknown): string[][] {
	const found: string[][] = [];
	const seen = new Set<unknown>();
	const walk = (value: unknown, path: string[]): void => {
		if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return;
		if (typeof value === 'function') found.push(path);
		if (seen.has(value)) return;
		seen.add(value);
		for (const key of Object.keys(value)) walk((value as Record<string, unknown>)[key], [...path, key]);
	};
	walk(root, []);
	return found;
}

// A recorded path accounts for a callable at or under it. A strict or coerce member belongs to its bundle. The
// routes under a path are the planned routes, which routeOffences holds to kinds the parser shows as nodes.
const accountedFor = (path: readonly string[], recorded: readonly (readonly string[])[]): boolean =>
	recorded.some((r) => r.length <= path.length && r.every((segment, i) => path[i] === segment));

async function unrecordedBuilders(grammar: keyof typeof ENGINES): Promise<string[]> {
	const engine = await ENGINES[grammar]();
	const model = await loadNodeModel(grammar);
	const recorded = [...Object.values(model.builderPaths), ...Object.values(model.builderPathAlternates).flat()];
	return callablePaths(engine.build)
		.filter((path) => !accountedFor(path, recorded))
		.map((path) => `${path.join('.')} (unrecorded builder)`);
}

describe('hidden-kind builders', () => {
	for (const grammar of Object.keys(ENGINES) as (keyof typeof ENGINES)[]) {
		it(`${grammar}: no builder exists for a kind the parser never shows as a node`, async () => {
			const offending = await neverNodeBuilders(grammar);
			expect(offending, `${grammar} builders for never-node kinds:\n${offending.join('\n')}`).toEqual([]);
		}, 240_000);
	}
});

describe('every planned route builds a kind the parser shows as a node', () => {
	for (const grammar of Object.keys(ENGINES) as (keyof typeof ENGINES)[]) {
		it(`${grammar}: no route builds a never-node kind`, async () => {
			const offences = routeOffences(await compileOf(grammar));
			expect(offences, `${grammar} routes that build a never-node kind:\n${offences.join('\n')}`).toEqual([]);
		}, 240_000);
	}
});

describe('every callable on the build surface is a recorded builder', () => {
	for (const grammar of Object.keys(ENGINES) as (keyof typeof ENGINES)[]) {
		it(`${grammar}: no callable is unaccounted for by the model`, async () => {
			const unrecorded = await unrecordedBuilders(grammar);
			expect(unrecorded, `${grammar} callables the model does not record:\n${unrecorded.join('\n')}`).toEqual([]);
		}, 240_000);
	}
});
