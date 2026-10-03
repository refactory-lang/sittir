import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createEngine } from '@sittir/common';
import { isFactoryNode } from '@sittir/common/utils';
import { emitFactorySourceText } from '../emit/factory-source.ts';
import { languageByName } from '../languages.ts';
import { loadLanguageForGrammar } from '../validate/common.ts';

const TOOLS_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const REPO_ROOT = join(TOOLS_ROOT, '..', '..');

export type GapClass = 'tight' | 'space' | 'newline' | 'blankline' | 'double_blankline';

export interface Token {
	readonly text: string;
	readonly from: number;
	readonly to: number;
}

interface TreeNode {
	readonly text: string;
	readonly startIndex: number;
	readonly endIndex: number;
	readonly childCount: number;
	readonly children: readonly TreeNode[];
}

export interface GapDifference {
	readonly index: number;
	readonly line: number;
	readonly before: string;
	readonly after: string;
	readonly source: string;
	readonly rendered: string;
	readonly sourceClass: GapClass;
	readonly renderedClass: GapClass;
	readonly indentOnly: boolean;
}

export interface Site {
	readonly keys: readonly string[];
	readonly paths: readonly string[];
}

export interface Attribution {
	readonly path: string;
	readonly arm: GapClass;
	readonly fixed: number;
	readonly broken: number;
	readonly examples: readonly string[];
}

export interface DefaultDiffReport {
	readonly grammar: string;
	readonly gaps: number;
	readonly differing: number;
	readonly indentOnly: number;
	readonly tokenMismatches: number;
	readonly unattributed: readonly GapDifference[];
	readonly attributions: readonly Attribution[];
	readonly rendered: string;
}

export function gapClassOf(text: string): GapClass {
	const breaks = text.split('\n').length - 1;
	if (breaks === 0) return text === '' ? 'tight' : 'space';
	if (breaks === 1) return 'newline';
	return breaks === 2 ? 'blankline' : 'double_blankline';
}

export function tokensOf(root: TreeNode): Token[] {
	const tokens: Token[] = [];
	const walk = (node: TreeNode): void => {
		if (node.childCount === 0) {
			if (node.endIndex > node.startIndex) tokens.push({ text: node.text, from: node.startIndex, to: node.endIndex });
			return;
		}
		for (const child of node.children) walk(child);
	};
	walk(root);
	return tokens;
}

function lineOf(source: string, offset: number): number {
	let line = 1;
	for (let i = source.indexOf('\n'); i !== -1 && i < offset; i = source.indexOf('\n', i + 1)) line += 1;
	return line;
}

const RESYNC_WINDOW = 16;

export function alignTokens(a: readonly Token[], b: readonly Token[]): { readonly pairs: readonly (readonly [number, number])[]; readonly mismatches: number } {
	const pairs: [number, number][] = [];
	let mismatches = 0;
	let i = 0;
	let j = 0;
	while (i < a.length && j < b.length) {
		if (a[i]!.text === b[j]!.text) {
			pairs.push([i, j]);
			i += 1;
			j += 1;
			continue;
		}
		mismatches += 1;
		let resynced = false;
		for (let window = 1; window <= RESYNC_WINDOW && !resynced; window++) {
			for (let da = 0; da <= window && !resynced; da++) {
				const db = window - da;
				if (i + da < a.length && j + db < b.length && a[i + da]!.text === b[j + db]!.text) {
					i += da;
					j += db;
					resynced = true;
				}
			}
		}
		if (!resynced) break;
	}
	return { pairs, mismatches };
}

export function differences(
	sourceTokens: readonly Token[],
	source: string,
	renderedTokens: readonly Token[],
	rendered: string
): { readonly list: GapDifference[]; readonly gaps: number; readonly mismatches: number } {
	const { pairs, mismatches } = alignTokens(sourceTokens, renderedTokens);
	const list: GapDifference[] = [];
	let gaps = 0;
	for (let k = 0; k + 1 < pairs.length; k++) {
		const [sa, ra] = pairs[k]!;
		const [sb, rb] = pairs[k + 1]!;
		if (sb !== sa + 1 || rb !== ra + 1) continue;
		gaps += 1;
		const sourceGap = source.slice(sourceTokens[sa]!.to, sourceTokens[sb]!.from);
		const renderedGap = rendered.slice(renderedTokens[ra]!.to, renderedTokens[rb]!.from);
		if (sourceGap === renderedGap) continue;
		const sourceClass = gapClassOf(sourceGap);
		const renderedClass = gapClassOf(renderedGap);
		list.push({
			index: sa,
			line: lineOf(source, sourceTokens[sa]!.to),
			before: sourceTokens[sa]!.text,
			after: sourceTokens[sb]!.text,
			source: sourceGap,
			rendered: renderedGap,
			sourceClass,
			renderedClass,
			indentOnly: sourceClass === renderedClass && sourceClass !== 'tight' && sourceClass !== 'space'
		});
	}
	return { list, gaps, mismatches };
}

const BRANCH = /AddressNode::Branch \{ key: "(\w+)", path: "(?:[^"\\]|\\.)*", children: &\[$/;
const LEAF = /AddressNode::(?:Spacing|Delimiter) \{ key: "(\w+)", sites: &\[(.*)\] \},?$/;
const SITE_PATH = /path: "((?:[^"\\]|\\.)*)"/g;

export function sitesOf(grammar: string): Site[] {
	const file = join(REPO_ROOT, 'rust', 'crates', `sittir-${grammar}`, 'src', 'render', 'options.rs');
	const sites: Site[] = [];
	const stack: string[] = [];
	for (const raw of readFileSync(file, 'utf8').split('\n')) {
		const line = raw.trim();
		const branch = BRANCH.exec(line);
		if (branch !== null) {
			stack.push(branch[1]!);
			continue;
		}
		if (/^\] \},?$/.test(line)) {
			stack.pop();
			continue;
		}
		const leaf = LEAF.exec(line);
		if (leaf === null || stack.length === 0) continue;
		const paths = [...leaf[2]!.matchAll(SITE_PATH)].map((match) => JSON.parse(`"${match[1]!}"`) as string);
		if (paths.length > 0) sites.push({ keys: [...stack, leaf[1]!], paths });
	}
	return sites;
}

export function optionsOf(site: Site, arm: number): Record<string, unknown> {
	const root: Record<string, unknown> = {};
	let at = root;
	site.keys.forEach((key, index) => {
		if (index === site.keys.length - 1) at[key] = arm;
		else {
			const next: Record<string, unknown> = {};
			at[key] = next;
			at = next;
		}
	});
	return root;
}

export interface DefaultDiffOptions {
	readonly attribute?: boolean;
	readonly onTrial?: (site: Site, arm: GapClass, fixed: number, broken: number) => void;
}

let moduleCount = 0;

const ATTRIBUTION_ARMS: readonly GapClass[] = ['tight', 'space', 'newline', 'blankline', 'double_blankline'];
const ARM_KIND: Readonly<Record<GapClass, string>> = { tight: 'Tight', space: 'Space', newline: 'Newline', blankline: 'Blankline', double_blankline: 'DoubleBlankline' };

export async function defaultDiff(grammar: string, source: string, options: DefaultDiffOptions = {}): Promise<DefaultDiffReport> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tokensOfText = (text: string): Token[] => {
		const tree = parser.parse(text);
		if (!tree) throw new Error(`default-diff: the ${grammar} parse failed`);
		try {
			return tokensOf(tree.rootNode);
		} finally {
			tree.delete();
		}
	};
	const sourceTokens = tokensOfText(source);
	const moduleDir = join(TOOLS_ROOT, '.default-diff');
	mkdirSync(moduleDir, { recursive: true });
	moduleCount += 1;
	const language = await languageByName(grammar);
	const defaultEngine = await createEngine(language);
	const file = join(moduleDir, `${grammar}-${process.pid}-${moduleCount}.ts`);
	try {
		writeFileSync(file, await emitFactorySourceText(grammar, source, 'Generated', { surface: 'strict' }));
		const generated: Record<string, unknown> = await import(pathToFileURL(file).href);
		const factory = generated['Generated'];
		if (typeof factory !== 'function') throw new Error('default-diff: the emitted module exports no `Generated` factory');
		const built: unknown = factory();
		if (!isFactoryNode(built)) throw new Error('default-diff: `Generated` did not build a node');
		const renderWith = async (render: object | undefined): Promise<string> => {
			if (render === undefined) return defaultEngine.render(built).toString();
			const engine = await createEngine(language, { render });
			try {
				return engine.render(built).toString();
			} finally {
				engine.dispose();
			}
		};
		const kindId = (name: string): number => {
			const id: unknown = Reflect.get(defaultEngine.kinds, name);
			if (typeof id !== 'number') throw new Error(`default-diff: the ${grammar} engine has no kind \`${name}\``);
			return id;
		};
		const rendered = await renderWith(undefined);
		const base = differences(sourceTokens, source, tokensOfText(rendered), rendered);
		const baseIndices = new Set(base.list.filter((d) => !d.indentOnly).map((d) => d.index));
		const attributions: Attribution[] = [];
		const attributed = new Set<number>();
		if (options.attribute !== false && baseIndices.size > 0) {
			const wanted = new Set(base.list.filter((d) => !d.indentOnly).map((d) => d.sourceClass));
			const seen = new Set<string>();
			for (const site of sitesOf(grammar)) {
				for (const arm of ATTRIBUTION_ARMS) {
					if (!wanted.has(arm)) continue;
					const key = `${site.keys.join('.')}=${arm}`;
					if (seen.has(key)) continue;
					seen.add(key);
					let text: string;
					try {
						text = await renderWith(optionsOf(site, kindId(ARM_KIND[arm])));
					} catch {
						continue;
					}
					if (text === rendered) continue;
					const after = differences(sourceTokens, source, tokensOfText(text), text);
					const afterIndices = new Set(after.list.filter((d) => !d.indentOnly).map((d) => d.index));
					const fixedIndices = [...baseIndices].filter((i) => !afterIndices.has(i));
					const broken = [...afterIndices].filter((i) => !baseIndices.has(i)).length;
					options.onTrial?.(site, arm, fixedIndices.length, broken);
					if (fixedIndices.length === 0) continue;
					for (const i of fixedIndices) attributed.add(i);
					attributions.push({
						path: site.paths.join(' | '),
						arm,
						fixed: fixedIndices.length,
						broken,
						examples: fixedIndices.slice(0, 3).map((i) => {
							const d = base.list.find((x) => x.index === i)!;
							return `${d.line}: ${JSON.stringify(d.before)} ${JSON.stringify(d.after)}`;
						})
					});
				}
			}
		}
		return {
			grammar,
			gaps: base.gaps,
			differing: base.list.length,
			indentOnly: base.list.filter((d) => d.indentOnly).length,
			tokenMismatches: base.mismatches,
			unattributed: base.list.filter((d) => !d.indentOnly && !attributed.has(d.index)),
			attributions: attributions.sort((x, y) => y.fixed - y.broken - (x.fixed - x.broken)),
			rendered
		};
	} finally {
		defaultEngine.dispose();
		rmSync(file, { force: true });
	}
}

export interface DefaultDiffRun {
	readonly grammar: string;
	readonly files: readonly string[];
	readonly json: boolean;
	readonly noAttribute: boolean;
	readonly renderedDir?: string;
}

export interface AggregatedSite {
	readonly path: string;
	readonly arm: GapClass;
	readonly fixed: number;
	readonly broken: number;
	readonly files: number;
	readonly examples: readonly string[];
}

export function aggregate(reports: readonly (DefaultDiffReport & { readonly file: string })[]): AggregatedSite[] {
	const rows = new Map<string, { path: string; arm: GapClass; fixed: number; broken: number; files: Set<string>; examples: string[] }>();
	for (const report of reports) {
		for (const row of report.attributions) {
			const key = `${row.path}=${row.arm}`;
			const entry = rows.get(key) ?? { path: row.path, arm: row.arm, fixed: 0, broken: 0, files: new Set<string>(), examples: [] };
			entry.fixed += row.fixed;
			entry.broken += row.broken;
			entry.files.add(report.file);
			if (entry.examples.length < 3) entry.examples.push(...row.examples.slice(0, 3 - entry.examples.length).map((e) => `${report.file.split('/').pop()}:${e}`));
			rows.set(key, entry);
		}
	}
	return [...rows.values()]
		.map(({ files, ...rest }) => ({ ...rest, files: files.size }))
		.sort((x, y) => y.fixed - y.broken - (x.fixed - x.broken));
}

export async function run(opts: DefaultDiffRun): Promise<number> {
	const reports = [];
	const failed: { file: string; message: string }[] = [];
	for (const file of opts.files) {
		try {
			const { rendered, ...report } = await defaultDiff(opts.grammar, readFileSync(file, 'utf8'), { attribute: !opts.noAttribute });
			if (opts.renderedDir !== undefined) {
				mkdirSync(opts.renderedDir, { recursive: true });
				writeFileSync(join(opts.renderedDir, `${basename(file)}.rendered`), rendered);
			}
			reports.push({ file, rendered: '', ...report });
		} catch (error) {
			failed.push({ file, message: error instanceof Error ? error.message.split('\n')[0]! : String(error) });
		}
	}
	const table = aggregate(reports);
	if (opts.json) {
		process.stdout.write(`${JSON.stringify({ grammar: opts.grammar, files: reports.map(({ rendered: _r, ...r }) => r), failed, sites: table }, null, 2)}\n`);
		return failed.length > 0 ? 1 : 0;
	}
	for (const report of reports) {
		process.stdout.write(`${report.file}: ${report.differing}/${report.gaps} gaps differ (${report.indentOnly} indent-only, ${report.tokenMismatches} token mismatches, ${report.unattributed.length} unattributed)\n`);
	}
	for (const { file, message } of failed) process.stdout.write(`${file}: rebuild failed: ${message}\n`);
	process.stdout.write('site\tarm\tfixed\tbroken\tfiles\texamples\n');
	for (const row of table) process.stdout.write(`${row.path}\t${row.arm}\t${row.fixed}\t${row.broken}\t${row.files}\t${row.examples.join('; ')}\n`);
	return failed.length > 0 ? 1 : 0;
}
