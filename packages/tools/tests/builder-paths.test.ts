import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadNodeModel } from '../src/validate/common.ts';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;

const NOT_ROUTES = new Set(['strict', 'coerce']);

function at(root: unknown, path: readonly string[]): unknown {
	return path.reduce<unknown>((value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]), root);
}

async function irOf(grammar: string): Promise<Record<string, unknown>> {
	return ((await import(`../../${grammar}/src/ir.ts`)) as { ir: Record<string, unknown> }).ir;
}

describe.each(GRAMMARS)('%s builder paths', (grammar) => {
	it('resolves every builder path on ir', async () => {
		const model = await loadNodeModel(grammar);
		const ir = await irOf(grammar);
		expect(Object.keys(model.builderPaths).length).toBeGreaterThan(0);
		expect(Object.entries(model.builderPaths).filter(([, path]) => at(ir, path) === undefined)).toEqual([]);
	});

	it('resolves every builder path alternate on ir', async () => {
		const model = await loadNodeModel(grammar);
		const ir = await irOf(grammar);
		const stray = Object.entries(model.builderPathAlternates).flatMap(([kind, alternates]) =>
			alternates.filter((path) => at(ir, path) === undefined).map((path) => `${kind}: ${path.join('.')}`)
		);
		expect(stray).toEqual([]);
	});

	it('lists every ir path that reaches a builder as that kind\'s builder path or an alternate', async () => {
		const model = await loadNodeModel(grammar);
		const ir = await irOf(grammar);
		const kindOf = new Map(Object.entries(model.builderPaths).map(([kind, path]) => [at(ir, path), kind]));
		const unlisted: string[] = [];
		const walk = (value: unknown, path: readonly string[], onPath: ReadonlySet<unknown>): void => {
			const kind = kindOf.get(value);
			if (kind !== undefined && path.length > 0) {
				const listed = [model.builderPaths[kind]!, ...(model.builderPathAlternates[kind] ?? [])].map((p) => p.join('.'));
				if (!listed.includes(path.join('.'))) unlisted.push(`${kind}: ${path.join('.')}`);
			}
			if (value === null || (typeof value !== 'object' && typeof value !== 'function') || onPath.has(value)) return;
			for (const key of Object.keys(value)) {
				if (NOT_ROUTES.has(key)) continue;
				walk((value as Record<string, unknown>)[key], [...path, key], new Set([...onPath, value]));
			}
		};
		walk(ir, [], new Set());
		expect(unlisted).toEqual([]);
	});

	it('nests a builder under a kind it is a member of or a slot of, and a supertype admits every member built under it', async () => {
		const model = await loadNodeModel(grammar);
		const { is, isMember, membersOf } = (await import(`../../${grammar}/src/is.ts`)) as {
			is: Record<string, (value: { $type: number }) => boolean>;
			isMember(kind: number, type: number): boolean;
			membersOf(kind: number): readonly number[];
		};
		const { kindIdFromName } = (await import(`../../${grammar}/src/types.ts`)) as { kindIdFromName(name: string): number };
		const admits = (holder: string, kind: string): boolean => {
			const types = membersOf(kindIdFromName(kind));
			if (model.modelTypes[holder] !== 'supertype') return types.every((type) => isMember(kindIdFromName(holder), type));
			const guard = is[model.irKeys[holder]!];
			return guard !== undefined && types.every(($type) => guard({ $type }));
		};
		const holds = (owner: string, kind: string): boolean => Object.values(model.slotKinds[owner] ?? {}).some((kinds) => kinds.includes(kind));
		const routes = Object.entries(model.builderPaths).map(([kind, path]) => [kind, [path, ...(model.builderPathAlternates[kind] ?? [])]] as const);
		const kindAt = new Map(routes.flatMap(([kind, paths]) => paths.map((path) => [path.join('.'), kind] as const)));
		const strays = routes.flatMap(([kind, paths]) =>
			paths.flatMap((path) => {
				const chain = path.map((_, end) => kindAt.get(path.slice(0, end + 1).join('.')));
				const found: string[] = [];
				let throughMembers = true;
				for (let at = chain.length - 2; at >= 0; at--) {
					const [holder, next] = [chain[at], chain[at + 1]];
					if (holder === undefined || next === undefined) return [`${kind} at ${path.join('.')}: unresolved step ${at}`];
					if (!admits(holder, next)) {
						if (holds(holder, next)) throughMembers = false;
						else found.push(`${kind} at ${path.join('.')}: ${holder} neither admits nor holds ${next}`);
					}
					if (throughMembers && model.modelTypes[holder] === 'supertype' && !admits(holder, kind)) found.push(`${kind} at ${path.join('.')}: is.${model.irKeys[holder]}`);
				}
				return found;
			})
		);
		expect(strays).toEqual([]);
	});

	it('names an ir member with every ir key', async () => {
		const model = await loadNodeModel(grammar);
		const ir = await irOf(grammar);
		expect(Object.entries(model.irKeys).filter(([, key]) => !(key in ir))).toEqual([]);
	});

	it('names no missing ir builder in the generated coercers', async () => {
		const ir = await irOf(grammar);
		const coerce = readFileSync(new URL(`../../${grammar}/src/factories/coerce.ts`, import.meta.url), 'utf8');
		const named = new Set([...coerce.matchAll(/\bir\.([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)/g)].map((match) => match[1]!));
		expect([...named].filter((path) => at(ir, path.split('.')) === undefined)).toEqual([]);
	});
});

it('builds a seated rust comment form through the comment that owns it', async () => {
	const model = await loadNodeModel('rust');
	expect(model.builderPaths.line_comment_doc_outer).toEqual(['lineComment', 'docOuter']);
	expect(model.builderPaths.block_comment_doc_inner).toEqual(['blockComment', 'docInner']);
});

it('builds a kind two hosts declare through the first host and records the other', async () => {
	const model = await loadNodeModel('python');
	expect(model.builderPaths.parenthesized_import_list).toEqual(['futureImportStatement', 'parenthesizedImportList']);
	expect(model.builderPathAlternates.parenthesized_import_list).toEqual([
		['simpleStatement', 'futureImport', 'parenthesizedImportList'],
		['importFromStatement', 'parenthesizedImportList'],
		['simpleStatement', 'importFrom', 'parenthesizedImportList']
	]);
});

it('builds a seated arm through the envelope that declares it', async () => {
	const model = await loadNodeModel('python');
	expect(model.builderPaths.simple_pattern_negative).toEqual(['simplePattern', 'negative']);
});

it('builds a match block form through its flat key first, with its owner route as the alternate, as a suite block does', async () => {
	const model = await loadNodeModel('python');
	expect(model.builderPaths.match_block_block).toEqual(['matchBlockBlock']);
	expect(model.builderPathAlternates.match_block_block).toEqual([['matchBlock', 'block']]);
	expect(model.builderPaths.match_block_empty).toEqual(['matchBlockEmpty']);
	expect(model.builderPathAlternates.match_block_empty).toEqual([['matchBlock', 'empty']]);
	expect(model.builderPaths.suite_block).toEqual(['suiteBlock']);
	expect(model.builderPathAlternates.suite_block).toContainEqual(['suite', 'block']);
});

it('builds a kind through its own flat key first and keeps its owner route as an alternate', async () => {
	const model = await loadNodeModel('python');
	expect(model.builderPaths.integer_hex).toEqual(['integerHex']);
	expect(model.builderPathAlternates.integer_hex).toEqual([
		['integer', 'hex'],
		['primaryExpression', 'integer', 'hex'],
		['expression', 'primary', 'integer', 'hex']
	]);
});
