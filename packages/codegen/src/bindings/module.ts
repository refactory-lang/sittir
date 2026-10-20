import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { withDslGlobals } from '../dsl/evaluate.ts';
import type { Bindings, LeadMatch } from '../dsl/bind.ts';
import { grammarPackageDir, type GrammarName } from '../grammars.ts';
import { REGENERATE_BINDINGS_COMMAND } from './hash.ts';
import type { GrammarBindings, GrammarBindingsEdit, GrammarBindingsPatch } from './grammar-bindings.ts';

export const BINDINGS_MODULE = 'grammar.bindings.ts';

export const bindingsModulePath = (grammar: GrammarName): string => join(grammarPackageDir(grammar), BINDINGS_MODULE);

export async function loadBindingsModule(dir: string): Promise<Bindings | undefined> {
	const path = join(dir, BINDINGS_MODULE);
	if (!existsSync(path)) return undefined;
	const module = (await withDslGlobals(() => import(pathToFileURL(path).href))) as { readonly default?: Bindings };
	return module.default;
}

const q = (v: string): string => JSON.stringify(v);

const editCall = (edit: GrammarBindingsEdit): string => ('field' in edit ? `field(${q(edit.field)})` : `alias(sym(${q(edit.alias.from)}), sym(${q(edit.alias.to)}))`);

const patchSet = (patches: readonly GrammarBindingsPatch[]): string => `{ ${patches.map((p) => `${q(p.path)}: ${editCall(p.edit)}`).join(', ')} }`;

function matchCall(m: LeadMatch): string {
	const admits = (within: NonNullable<LeadMatch['within']>): string => `[${within.admits.map(matchCall).join(', ')}]`;
	const within = m.within === undefined ? [] : [m.within.field === null ? admits(m.within) : `{ ${q(m.within.field)}: ${admits(m.within)} }`];
	const as = m.as === undefined ? [] : [...(within.length === 0 ? ['undefined'] : []), q(m.as)];
	return `match(${[q(m.kind), ...within, ...as].join(', ')})`;
}

function list(lines: readonly string[]): string {
	return lines.length === 0 ? '[]' : `[\n${lines.join(',\n')}\n\t]`;
}

export function printBindingsModule(bindings: GrammarBindings, hash: string): string {
	const patchLines = [...bindings.patches].map(([kind, sets]) => `\t\t${kind}: ${sets.length === 1 ? patchSet(sets[0]!) : `[${sets.map(patchSet).join(', ')}]`}`);
	const renameLines = Object.entries(bindings.renames).map(([from, to]) => `\t\trename(${q(from)}, ${q(to)})`);
	const leadLines = bindings.leads.map((l) => `\t\tlead(${[q(l.list), q(l.item), q(l.field), ...l.admits.map(matchCall)].join(', ')})`);
	const splitLines = bindings.splits.map(
		(s) => `\t\tsplit(${q(s.kind)}, ${q(s.as)}, { within: [${s.within.map(q).join(', ')}], containers: [${s.containers.map((c) => `{ name: ${q(c.name)}, field: ${q(c.field)} }`).join(', ')}] })`
	);
	const edits = [...bindings.patches.values()].flat(2).map((p) => p.edit);
	const helpers = [
		...(edits.some((e) => 'alias' in e) ? ['alias'] : []),
		'bindings',
		...(edits.some((e) => 'field' in e) ? ['field'] : []),
		...(leadLines.length > 0 ? ['lead', 'match'] : []),
		...(renameLines.length > 0 ? ['rename'] : []),
		...(splitLines.length > 0 ? ['split'] : [])
	];
	return `// Generated from bindings.scm and the vocabulary by \`${REGENERATE_BINDINGS_COMMAND}\`. Do not edit.
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import { ${helpers.join(', ')} } from '../codegen/src/dsl/dsl-authoring.ts';

export default bindings({
	hash: ${q(hash)},
	patches: {
${patchLines.join(',\n')}
	},
	renames: ${list(renameLines)},
	leads: ${list(leadLines)},
	splits: ${list(splitLines)}
});
`;
}
