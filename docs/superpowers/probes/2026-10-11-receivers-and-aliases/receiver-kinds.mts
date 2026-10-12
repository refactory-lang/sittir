/**
 * Receiver census: the vocabulary's function-like kinds (functions, methods, lambdas, signatures, parameters,
 * extensions), with the module or feature declaring each, its parent and its members, then the member stubs
 * features add to the receiver's kind and to the impl blocks. It shows which kinds declare `receiver`, and
 * which feature owns `declaration.parameter.self`.
 *
 *   pnpm exec tsx docs/superpowers/probes/2026-10-11-receivers-and-aliases/receiver-kinds.mts [<checkout>]
 *
 * Reads the checkout's vocabulary sources through the checkout's own reader (packages/tools/src/vocabulary/read.ts).
 * Prints one line per kind (path, declaring module or feature, parent, members), one line per stubbed kind, and
 * last every declaration of `receiver` as feature[kind].
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

interface Declared {
	readonly qname: string;
	readonly path?: string;
	readonly parent?: string;
	readonly members: readonly { readonly name: string }[];
}
interface Source {
	readonly kinds: readonly Declared[];
	readonly modules: ReadonlyMap<string, string>;
	readonly features: readonly { readonly dir: string; readonly stubs: readonly Declared[] }[];
}

const root = process.argv[2] ?? process.cwd();
const reader = (await import(pathToFileURL(join(root, 'packages/tools/src/vocabulary/read.ts')).href)) as {
	readVocabularySource(dir: string): Source;
	isKind(d: Declared): boolean;
};
const source = reader.readVocabularySource(join(root, 'packages/types/src/vocabulary'));
const declared = [...source.kinds, ...source.features.flatMap((f) => f.stubs.filter(reader.isKind))];
const where = new Map<string, string>();
for (const kind of source.kinds) where.set(kind.path!, `base:${source.modules.get(kind.qname.replace(/\..*$/, ''))}`);
for (const feature of source.features) for (const stub of feature.stubs) if (reader.isKind(stub)) where.set(stub.path!, `feature:${feature.dir}`);

const functionLike = /function|method|lambda|signature|parameter|extension/;
for (const [path, declaredIn] of [...where].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
	if (!functionLike.test(path)) continue;
	const kind = declared.find((d) => d.path === path)!;
	process.stdout.write(`${path.padEnd(48)} ${declaredIn.padEnd(36)} parent=${kind.parent ?? '-'} members=${kind.members.map((m) => m.name).join(',')}\n`);
}
const stubsOn = (qname: string): string[] =>
	source.features.flatMap((f) => f.stubs.filter((s) => s.qname === qname && !reader.isKind(s)).map((s) => `${f.dir}[${s.members.map((m) => m.name).join(',')}]`));
for (const qname of ['Declaration.Parameter.Self', 'Declaration.Extension', 'Declaration.Extension.Conformance'])
	process.stdout.write(`stubs on ${qname}: ${stubsOn(qname).join('  ') || '-'}\n`);
const receivers = [
	...source.kinds.filter((k) => k.members.some((m) => m.name === 'receiver')).map((k) => `base[${k.qname}]`),
	...source.features.flatMap((f) => f.stubs.filter((s) => s.members.some((m) => m.name === 'receiver')).map((s) => `${f.dir}[${s.qname}]`))
];
process.stdout.write(`receiver declared by: ${receivers.join('  ') || '-'}\n`);
