import { boundKindName, readVocabulary, VOCABULARY_DIR } from '../../../../packages/codegen/src/bindings/index.ts';

const vocabulary = await readVocabulary(VOCABULARY_DIR);
const paths = [...vocabulary.kinds.keys()];
const snake = (name: string): string => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const keep = (wide: boolean) => (namespace: string, parent: string, child: string): boolean => {
	const members = parent && vocabulary.kinds.has(parent) ? [...vocabulary.slots(parent).keys()].map(snake) : [];
	if (members.includes(child) || vocabulary.kinds.has(`${parent}.${child}`)) return true;
	if (!wide) return false;
	return paths.some((p) => p.startsWith(`${parent}.`) && !p.startsWith(`${namespace}.`) && p.split('.').slice(parent.split('.').length).includes(child));
};
const bound = (path: string, wide: boolean): string => {
	const segments = path.split('.');
	const kept = segments.filter((_, at) => {
		if (at === segments.length - 1) return true;
		const namespace = segments.slice(0, at + 1).join('.');
		if (!vocabulary.namespaces.has(namespace)) return true;
		return keep(wide)(namespace, segments.slice(0, at).join('.'), segments[at + 1]!);
	});
	return kept.reverse().join('_');
};
for (const wide of [false, true]) {
	const flips = paths.filter((p) => bound(p, wide) !== boundKindName(p, false, vocabulary.namespaces));
	console.log(`\n${wide ? 'wide (a kind anywhere beneath the parent spelled the same also counts)' : 'strict (a member of the parent, or a kind directly beneath it)'}: ${flips.length} bound names flip back`);
	for (const p of flips) console.log(`  ${p}: ${boundKindName(p, false, vocabulary.namespaces)} → ${bound(p, wide)}`);
	const names = new Map<string, string[]>();
	for (const p of paths) {
		const n = bound(p, wide);
		(names.get(n) ?? names.set(n, []).get(n)!).push(p);
	}
	const dup = [...names].filter(([, ps]) => ps.length > 1);
	console.log(`  bound names shared by two kinds after the flip: ${dup.length}${dup.length ? ' ' + JSON.stringify(dup) : ''}`);
}
