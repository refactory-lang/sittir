import { join, relative } from 'node:path';
import { PORTABLE_TYPED_FILE, PORTABLE_TYPED_TSCONFIG, generate, parseTypeCheckDiagnostics, typeCheckOutput, writePortableTyped, type PortableTypedUnemitted, type TypeCheckDiagnostic } from '@sittir/codegen';
import { REPO_ROOT, grammarPackageDir, sittirDirOf, type GrammarName } from '@sittir/codegen/grammars';
import { bindingGrammars } from '@sittir/codegen/bindings';

export interface ConformanceCause {
	readonly name: string;
	readonly why: string;
	readonly count: number;
	readonly example: string | undefined;
}

export interface ConformanceReport {
	readonly grammar: string;
	readonly causes: readonly ConformanceCause[];
	readonly unemitted: readonly PortableTypedUnemitted[];
	readonly total: number;
}


interface Cause {
	readonly name: string;
	readonly why: string;
	readonly test: (d: TypeCheckDiagnostic, reason: string) => boolean;
}

const NOT_ASSIGNABLE = /^Type '(.*)' is not assignable to type '(.*)'\.?$/;

const reasonOf = (d: TypeCheckDiagnostic): string => [d.message, ...d.detail].filter((line) => line.includes(' is not assignable to type ') || line.includes(' is missing ')).at(-1) ?? d.message;

const sides = (reason: string): readonly [source: string, target: string] | undefined => {
	const match = NOT_ASSIGNABLE.exec(reason);
	return match === null ? undefined : [match[1]!, match[2]!];
};

const isList = (type: string): boolean => type.startsWith('readonly ') && type.endsWith('[]');

export const CAUSES: readonly Cause[] = [
	{ name: 'context fill', why: "the grammar's own slot fill holds an arm the namespace map's fill does not admit", test: (d) => d.code === 'TS2344' },
	{ name: 'extra member', why: 'a member the bindings route that the interface does not declare', test: (d) => d.code === 'TS2353' || d.code === 'TS2561' },
	{ name: 'unreadable route', why: "a route step the grammar's typed surface has no reader for", test: (d) => d.code === 'TS2339' },
	{ name: 'missing member', why: 'a member the interface requires that the read entry has no route for', test: (d, reason) => d.code === 'TS2741' || /^Property '[^']+' is missing in type /.test(reason) || /is missing the following properties from type '(?!PortableHandle')/.test(reason) },
	{
		name: 'arity',
		why: 'a list read where the member holds one value, or one value where it holds a list',
		test: (_, reason) => {
			if (reason.includes("is missing the following properties from type 'PortableHandle'")) return true;
			const pair = sides(reason);
			return pair !== undefined && pair[0] !== 'undefined' && isList(pair[0]) !== isList(pair[1]);
		}
	},
	{
		name: 'refinement',
		why: "a refinement where its parent is admitted: the read gives a sub-path of the member's kind",
		test: (_, reason) => {
			const pair = sides(reason);
			return pair !== undefined && /^"[a-z_.]+"$/.test(pair[0]) && /^"[a-z_.]+"$/.test(pair[1]) && pair[0].slice(1, -1).startsWith(`${pair[1].slice(1, -1)}.`);
		}
	},
	{ name: 'absent', why: 'the read can be absent where the member is required', test: (_, reason) => sides(reason)?.[0] === 'undefined' },
	{ name: 'token text', why: 'a token read as its const string that the member type does not admit', test: (_, reason) => /^"[^"]*"$/.test(sides(reason)?.[0] ?? '') },
	{ name: 'unmapped', why: 'the member type is an unmapped marker where the read gives a mapped kind', test: (_, reason) => (sides(reason)?.[1] ?? '').includes('Unmapped<') && !(sides(reason)?.[0] ?? '').includes('Unmapped<') },
	{ name: 'text leaf', why: 'text read where the member admits only kinds', test: (_, reason) => sides(reason)?.[0] === 'string' },
	{ name: 'untyped reader', why: 'the low-level reader is typed unknown or as a bare number', test: (_, reason) => ['unknown', 'number'].includes(sides(reason)?.[0] ?? '') },
	{ name: 'kind', why: 'a vocabulary kind the member type does not admit', test: (_, reason) => sides(reason) !== undefined }
];

export const UNEMITTED_CAUSE = { name: 'unemitted', why: 'a read entry or member the emitter skipped, with its reason' } as const;
export const UNCLASSIFIED_CAUSE = { name: 'unclassified', why: 'an error in the module no cause matches' } as const;
export const OUTSIDE_CAUSE = { name: 'outside', why: 'an error outside the generated module' } as const;

const typedDir = (grammar: string): string => sittirDirOf({ dir: grammarPackageDir(grammar as GrammarName) });

export const portableTypedPath = (grammar: string): string => join(typedDir(grammar), PORTABLE_TYPED_FILE);

export function classify(diagnostics: readonly TypeCheckDiagnostic[], module: string, unemitted: readonly PortableTypedUnemitted[]): { readonly causes: readonly ConformanceCause[]; readonly total: number } {
	const counts = new Map<string, { count: number; example: string | undefined }>();
	const count = (name: string, example: string): void => {
		const at = counts.get(name) ?? counts.set(name, { count: 0, example }).get(name)!;
		at.count++;
	};
	for (const d of diagnostics) {
		const where = `${d.file === undefined ? '' : relative(REPO_ROOT, join(REPO_ROOT, d.file))}${d.line === undefined ? '' : `:${d.line}`}`;
		if (d.file === undefined || !join(REPO_ROOT, d.file).endsWith(module)) {
			count(OUTSIDE_CAUSE.name, `${where} ${d.code}`);
			continue;
		}
		const reason = reasonOf(d);
		const cause = CAUSES.find((c) => c.test(d, reason));
		count(cause?.name ?? UNCLASSIFIED_CAUSE.name, `${where} ${reason.slice(0, 160)}`);
	}
	for (const u of unemitted) count(UNEMITTED_CAUSE.name, `${u.kind} as ${u.vocab}${u.member === undefined ? '' : `.${u.member}`}: ${u.reason}`);
	const causes = [...CAUSES, UNEMITTED_CAUSE, UNCLASSIFIED_CAUSE, OUTSIDE_CAUSE].map(({ name, why }) => ({ name, why, count: counts.get(name)?.count ?? 0, example: counts.get(name)?.example }));
	return { causes, total: causes.reduce((n, c) => n + c.count, 0) };
}

export async function portableConformance(grammar: string): Promise<ConformanceReport | undefined> {
	const generated = await generate({ grammar, outputDir: join(grammarPackageDir(grammar as GrammarName), 'src') });
	await writePortableTyped(typedDir(grammar), generated.portableTyped?.source);
	if (generated.portableTyped === undefined) return undefined;
	const { unemitted } = generated.portableTyped;
	const diagnostics = parseTypeCheckDiagnostics(typeCheckOutput('pnpm', ['exec', 'tsrs', '-p', join(typedDir(grammar), PORTABLE_TYPED_TSCONFIG), '--noEmit'], REPO_ROOT));
	return { grammar, ...classify(diagnostics, portableTypedPath(grammar), unemitted), unemitted };
}

export function formatConformance(report: ConformanceReport): string {
	const lines = [`${report.grammar}: ${report.total} conformance errors`];
	for (const cause of report.causes) {
		if (cause.count === 0) continue;
		lines.push(`  ${String(cause.count).padStart(4)}  ${cause.name.padEnd(16)} ${cause.why}`);
		if (cause.name === UNEMITTED_CAUSE.name) for (const u of report.unemitted) lines.push(`        ${u.kind} as ${u.vocab}${u.member === undefined ? '' : `.${u.member}`}: ${u.reason}`);
		else if (cause.example !== undefined) lines.push(`        e.g. ${cause.example}`);
	}
	return lines.join('\n');
}

export interface PortableConformanceOptions {
	readonly grammars?: readonly string[];
}

export async function run(options: PortableConformanceOptions = {}): Promise<number> {
	for (const grammar of options.grammars ?? bindingGrammars()) {
		const report = await portableConformance(grammar);
		process.stdout.write(`${report === undefined ? `${grammar}: no bindings, no typed module` : formatConformance(report)}\n`);
	}
	return 0;
}
