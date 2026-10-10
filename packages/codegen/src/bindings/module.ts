import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { withDslGlobals } from '../compiler/evaluate.ts';
import type { Bindings } from '../dsl/bind.ts';
import { grammarPackageDir, type GrammarName } from '../grammars.ts';
import { REGENERATE_BINDINGS_COMMAND } from './hash.ts';
import type { BindingsOverlay, OverlayEdit, OverlayPatch } from './overlay.ts';

export const BINDINGS_MODULE = 'grammar.bindings.ts';

export const bindingsModulePath = (grammar: GrammarName): string => join(grammarPackageDir(grammar), BINDINGS_MODULE);

export async function loadBindingsModule(dir: string): Promise<Bindings | undefined> {
	const path = join(dir, BINDINGS_MODULE);
	if (!existsSync(path)) return undefined;
	const module = (await withDslGlobals(() => import(pathToFileURL(path).href))) as { readonly default?: Bindings };
	return module.default;
}

const q = (v: string): string => JSON.stringify(v);

const editCall = (edit: OverlayEdit): string => ('field' in edit ? `field(${q(edit.field)})` : `alias(sym(${q(edit.alias.from)}), sym(${q(edit.alias.to)}))`);

const patchSet = (patches: readonly OverlayPatch[]): string => `{ ${patches.map((p) => `${q(p.path)}: ${editCall(p.edit)}`).join(', ')} }`;

function list(lines: readonly string[]): string {
	return lines.length === 0 ? '[]' : `[\n${lines.join(',\n')}\n\t]`;
}

export function printBindingsModule(overlay: BindingsOverlay, hash: string): string {
	const patchLines = [...overlay.patches].map(([kind, sets]) => `\t\t${kind}: ${sets.length === 1 ? patchSet(sets[0]!) : `[${sets.map(patchSet).join(', ')}]`}`);
	const renameLines = Object.entries(overlay.renames).map(([from, to]) => `\t\trename(${q(from)}, ${q(to)})`);
	const splitLines = overlay.splits.map(
		(s) => `\t\tsplit(${q(s.kind)}, ${q(s.as)}, { within: [${s.within.map(q).join(', ')}], containers: [${s.containers.map((c) => `{ name: ${q(c.name)}, field: ${q(c.field)} }`).join(', ')}] })`
	);
	const edits = [...overlay.patches.values()].flat(2).map((p) => p.edit);
	const helpers = [
		...(edits.some((e) => 'alias' in e) ? ['alias'] : []),
		'bindings',
		...(edits.some((e) => 'field' in e) ? ['field'] : []),
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
	splits: ${list(splitLines)}
});
`;
}
