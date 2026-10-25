import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lead, LeadMatch } from '../dsl/verbs/effects.ts';
import { BINDINGS_MODULE, GRAMMAR_ENTRY, grammarPackageDir, type GrammarName, type GrammarPackage } from '../grammars.ts';
import { bindingsPathIn } from './facts.ts';
import { assertBindingsFresh, REGENERATE_BINDINGS_COMMAND } from './hash.ts';
import type { AbsentField, Split } from '../dsl/bind.ts';
import type { GrammarBindings, GrammarBindingsEdit, GrammarBindingsPatch } from './grammar-bindings.ts';
import { runPinned } from './read.ts';

export const bindingsModulePath = (grammar: GrammarName): string => join(grammarPackageDir(grammar), BINDINGS_MODULE);

export async function loadBindingsHash(dir: string): Promise<string | undefined> {
	const path = join(dir, BINDINGS_MODULE);
	if (!existsSync(path)) return undefined;
	return (await runPinned('exportedStrings', readFileSync(path, 'utf8'))).hash;
}

export async function assertPackageBindingsFresh(pkg: GrammarPackage): Promise<void> {
	assertBindingsFresh(pkg.name, await loadBindingsHash(pkg.dir), bindingsPathIn(pkg.dir));
}

const q = (v: string): string => JSON.stringify(v);

const editCall = (edit: GrammarBindingsEdit): string => ('field' in edit ? `field(${q(edit.field)})` : `alias(${q(edit.alias)})`);

const patchSet = (patches: readonly GrammarBindingsPatch[]): string => `{ ${patches.map((p) => `${q(p.path)}: ${editCall(p.edit)}`).join(', ')} }`;

function matchCall(m: LeadMatch): string {
	const admits = (within: NonNullable<LeadMatch['within']>): string => `[${within.admits.map(matchCall).join(', ')}]`;
	const within = m.within === undefined ? [] : [m.within.field === null ? admits(m.within) : `{ ${q(m.within.field)}: ${admits(m.within)} }`];
	const as = m.as === undefined ? [] : [...(within.length === 0 ? ['undefined'] : []), q(m.as)];
	return `match(${[q(m.kind), ...within, ...as].join(', ')})`;
}

const splitPath = (split: Split): string =>
	split.path.map((step) => `${step.field === null ? '' : `${step.field}:/`}(${step.kind}${step.as === null ? '' : ` as ${step.as}`})`).join('/');

function narrowedCopy(source: string, edits: readonly (readonly [string, string])[], absent: readonly AbsentField[]): string {
	const blanked = absent.filter((a) => a.through.length === 0).map((a) => [`${a.field}:`, 'blank()'] as const);
	const hidden = [...new Set(absent.flatMap((a) => a.through.slice(0, 1)))].map(
		(kind) =>
			[
				`(${kind})`,
				narrowedCopy(
					kind,
					[],
					absent.filter((a) => a.through[0] === kind).map((a) => ({ field: a.field, through: a.through.slice(1) }))
				)
			] as const
	);
	return `edit(copy(${q(source)}), { ${[...edits, ...blanked, ...hidden].map(([path, rule]) => `${q(path)}: ${rule}`).join(', ')} })`;
}

function splitEdit(split: Split): string {
	if (split.literal === undefined) return `alias(${q(split.as)})`;
	const { field, leaf, texts, absent } = split.literal;
	const text = texts.length === 1 ? q(texts[0]!) : `choice(${texts.map(q).join(', ')})`;
	const source = split.path[split.path.length - 1]!.kind;
	const arm = `alias(${narrowedCopy(source, [[`${field}:`, `alias(${text}, $.${leaf})`]], absent)}, $.${split.as})`;
	return `($, member) => choice(member, ${split.literal.relax.length === 0 ? arm : `prec.dynamic(1, ${arm})`})`;
}

const splitSet = (splits: readonly Split[]): string => `{ ${splits.map((s) => `${q(splitPath(s))}: ${splitEdit(s)}`).join(', ')} }`;

function relaxSets(splits: readonly Split[]): Map<string, string> {
	const arms = new Map<string, Map<string, string[]>>();
	for (const split of splits) {
		for (const site of split.literal?.relax ?? []) {
			const paths = arms.get(site.kind) ?? new Map<string, string[]>();
			paths.set(site.path, [...(paths.get(site.path) ?? []), ...split.literal!.texts.map((text) => `alias(${q(text)}, $.${site.display})`)]);
			arms.set(site.kind, paths);
		}
	}
	return new Map([...arms].map(([kind, paths]) => [kind, `{ ${[...paths].map(([path, added]) => `${q(path)}: ($, member) => ({ ...member, members: [...member.members, ${added.join(', ')}] })`).join(', ')} }`]));
}

const leadSet = (l: Lead): string => `{ ".": lead(${[q(l.item), q(l.field), ...l.admits.map(matchCall)].join(', ')}) }`;

function editEntries(bindings: GrammarBindings): string {
	const sets = new Map([...bindings.patches].map(([kind, patches]) => [kind, patches.map(patchSet)]));
	for (const l of bindings.leads) sets.set(l.list, [...(sets.get(l.list) ?? []), leadSet(l)]);
	for (const owner of new Set(bindings.splits.map((s) => s.owner)))
		sets.set(owner, [...(sets.get(owner) ?? []), splitSet(bindings.splits.filter((s) => s.owner === owner))]);
	for (const [kind, set] of relaxSets(bindings.splits)) sets.set(kind, [...(sets.get(kind) ?? []), set]);
	if (sets.size === 0) return '{}';
	const lines = [...sets].map(([kind, entries]) => `\t\t\t${kind}: ${entries.length === 1 ? entries[0]! : `[${entries.join(', ')}]`}`);
	return `{\n${lines.join(',\n')}\n\t\t}`;
}

function renamesData(renames: Readonly<Record<string, string>>): string {
	const lines = Object.entries(renames).map(([from, to]) => `\t${from}: ${q(to)}`);
	return lines.length === 0 ? '{}' : `{\n${lines.join(',\n')}\n}`;
}

export function printBindingsModule(bindings: GrammarBindings, hash: string): string {
	const edits = [...bindings.patches.values()].flat(2).map((p) => p.edit);
	const helpers = [
		...(edits.some((e) => 'alias' in e) || bindings.splits.length > 0 ? ['alias'] : []),
		...(bindings.splits.some((s) => s.literal !== undefined) ? ['copy', 'edit'] : []),
		'enrich',
		...(edits.some((e) => 'field' in e) ? ['field'] : []),
		...(bindings.leads.length > 0 ? ['lead'] : []),
		...(bindings.leads.some((l) => l.admits.length > 0) ? ['match'] : []),
		'wire'
	];
	return `// Generated from bindings.scm and the vocabulary by \`${REGENERATE_BINDINGS_COMMAND}\`. Do not edit.
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import sittir from './${GRAMMAR_ENTRY}';
import { ${helpers.join(', ')} } from '../codegen/src/dsl/dsl-authoring.ts';

export const hash = ${q(hash)};

export const renames = ${renamesData(bindings.renames)};

export default grammar(
	enrich(sittir),
	wire({
		generated: true,
		edits: ${editEntries(bindings)}
	})
);
`;
}
