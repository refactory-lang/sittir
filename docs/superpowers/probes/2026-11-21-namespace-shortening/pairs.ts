import { boundKindName, readVocabulary, VOCABULARY_DIR } from '../../../../packages/codegen/src/bindings/index.ts';

const vocabulary = await readVocabulary(VOCABULARY_DIR);
const paths = [...vocabulary.kinds.keys()];
const snake = (name: string): string => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

interface Row {
	readonly path: string;
	readonly bound: string;
	readonly unshortened: string;
	readonly namespace: string;
	readonly parent: string;
	readonly child: string;
	readonly siblingKind: boolean;
	readonly parentSlot: boolean;
	readonly parentFlag: boolean;
	readonly deeper: readonly string[];
}

const rows: Row[] = [];
for (const path of paths) {
	const segments = path.split('.');
	for (let at = 0; at < segments.length - 1; at++) {
		const namespace = segments.slice(0, at + 1).join('.');
		if (!vocabulary.namespaces.has(namespace)) continue;
		const parent = segments.slice(0, at).join('.');
		const child = segments[at + 1]!;
		const members = parent && vocabulary.kinds.has(parent) ? vocabulary.slots(parent) : new Map();
		const named = [...members].filter(([name]) => snake(name) === child);
		const beneath = paths.filter((p) => p.startsWith(`${parent}.`) && !p.startsWith(`${namespace}.`) && p !== namespace);
		rows.push({
			path,
			bound: boundKindName(path, false, vocabulary.namespaces),
			unshortened: boundKindName(path, false, new Set()),
			namespace,
			parent,
			child,
			siblingKind: vocabulary.kinds.has(`${parent}.${child}`),
			parentSlot: named.some(([, slot]) => !slot.flag),
			parentFlag: named.some(([, slot]) => slot.flag),
			deeper: beneath.filter((p) => p.split('.').slice(parent.split('.').length).includes(child) && p !== `${parent}.${child}`)
		});
	}
}

const byChild = new Map<string, Row[]>();
for (const row of rows) {
	const key = `${row.namespace} → ${row.parent}.${row.child}`;
	(byChild.get(key) ?? byChild.set(key, []).get(key)!).push(row);
}
console.log(`kind paths whose bound name leaves out a namespace: ${new Set(rows.map((r) => r.path)).size}; distinct (namespace, child) pairs: ${byChild.size}`);
console.log('namespace | parent | child | parent member | kind beneath parent spelled the same | kinds | example');
for (const [, group] of [...byChild].sort(([a], [b]) => a.localeCompare(b))) {
	const r = group[0]!;
	const member = r.parentSlot ? 'slot' : r.parentFlag ? 'flag' : '';
	const deeper = [...new Set(group.flatMap((g) => g.deeper))];
	console.log(
		[r.namespace, r.parent || '(root)', r.child, member, r.siblingKind ? `${r.parent}.${r.child}` : deeper.join(' '), group.length, `${r.path} → ${r.bound} (unshortened ${r.unshortened})`].join(' | ')
	);
}
