import { isParserHiddenName, listedNames } from '../rule-patterns.ts';
import { applyEntry, VerbRefusal, type VerbCtx } from './copy.ts';
import { renameMapOf, renameRefs, renameValue, type Effect } from './effects.ts';

export interface RenameEntry {
	readonly from: string;
	readonly to: string;
}

export type ListRename = 'refs' | 'names';

export interface RenameScope {
	readonly depth: number;
	readonly factoryInline: ReadonlySet<string>;
}

export function applyRenames(entries: readonly RenameEntry[], ctx: VerbCtx, scope: RenameScope): void {
	for (const entry of entries)
		applyEntry(ctx, { ownerKind: entry.from, name: `rename '${entry.from}' to '${entry.to}'`, details: { kind: entry.from, to: entry.to } }, () =>
			applyRename(entry, ctx, scope)
		);
}

export function applyRename({ from, to }: RenameEntry, ctx: VerbCtx, scope: RenameScope): void {
	const { rules } = ctx;
	if (scope.depth === 1) throw new VerbRefusal('rename-invalid', 'the first layer records no provenance, so a rename there could not give renamedFrom');
	const renamed = renameMapOf(ctx.effects);
	const externals = new Set([...listedNames(ctx.grammar.externals)].map((name) => renamed.get(name) ?? name));
	if (!(from in rules) && !externals.has(from)) throw new VerbRefusal('rename-invalid', 'the source is no rule or external of the grammar');
	if (Object.keys(rules)[0] === from) throw new VerbRefusal('rename-invalid', 'the source is the start rule, which stays first');
	if (isParserHiddenName(from) !== isParserHiddenName(to)) throw new VerbRefusal('rename-invalid', 'it flips hiddenness');
	if (to in rules || externals.has(to)) throw new VerbRefusal('rename-invalid', `the grammar already names '${to}', so it would be a merge, which an alias declares`);
	if (scope.factoryInline.has(from)) throw new VerbRefusal('rename-invalid', 'the source is a factoryInline kind, a list no rename rewrites');
	const rename = (name: string): string => (name === from ? to : name);
	for (const name of Object.keys(rules)) rules[name] = renameRefs(rules[name], rename);
	if (from in rules) {
		rules[to] = rules[from];
		rules[from] = { type: 'BLANK' };
		ctx.created.push(to);
	}
	ctx.effects.push({ kind: 'rename', from, to });
}

export function vacatedNames(effects: readonly Effect[]): ReadonlySet<string> {
	return new Set(effects.flatMap((effect) => (effect.kind === 'rename' ? [effect.from] : [])));
}

export function renamedLists<L extends object>(lists: L, kinds: { readonly [K in keyof L]-?: ListRename }, effects: readonly Effect[]): L {
	const renames = renameMapOf(effects);
	if (renames.size === 0) return lists;
	const rename = (name: string): string => renames.get(name) ?? name;
	const out = Object.fromEntries(Object.entries(lists));
	for (const [key, as] of Object.entries(kinds)) if (out[key] !== undefined) out[key] = (as === 'names' ? renameValue : renameRefs)(out[key], rename);
	return out as L;
}
