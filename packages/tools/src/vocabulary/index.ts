import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { formatSource } from '@sittir/codegen/run-codegen';
import { grammarMapName } from '@sittir/codegen';
import { PORTABLE_MAP_FILE, grammarPackageDir, type GrammarName } from '@sittir/codegen/grammars';
import { type Plan, plan } from './plan.ts';
import {
	AUGMENTATION,
	VOCABULARY_DIR,
	type VocabularySource,
	bindingGrammars,
	compositionOf,
	composedFeatures,
	readVocabularySource,
	vocabularySources
} from '@sittir/codegen/bindings';
import {
	augmentation,
	FEATURES_INDEX,
	featuresIndex,
	RESTATED_TEST,
	restatedChecks,
	restatedHeritage,
	restatedTest,
	UNFIT_RESTATED,
	type UnfitRestated
} from './write.ts';

export interface VocabularyFeaturesOptions {
	readonly write?: boolean;
	readonly check?: boolean;
	readonly dir?: string;
}

export interface Generated {
	readonly plan: Plan;
	readonly files: ReadonlyMap<string, string>;
}

export async function generate(dir: string = VOCABULARY_DIR): Promise<Generated> {
	const source = await readVocabularySource(dir);
	const p = plan(source);
	const files = new Map<string, string>();
	if (p.issues.length > 0) return { plan: p, files };
	files.set(AUGMENTATION, await formatSource(join(dir, AUGMENTATION), augmentation(source, p)));
	files.set(FEATURES_INDEX, await formatSource(join(dir, FEATURES_INDEX), featuresIndex(p)));
	for (const [file, text] of restatedSources(dir, p)) files.set(file, text);
	for (const [file, text] of restatedTests(dir, source, p)) files.set(file, await formatSource(join(dir, file), text));
	return { plan: p, files };
}

function restatedSources(dir: string, p: Plan): Map<string, string> {
	const out = new Map<string, string>();
	const seen = new Set<string>();
	for (const file of vocabularySources(dir)) {
		const text = readFileSync(join(dir, file), 'utf8');
		const rewritten = restatedHeritage(text, (path) => p.kinds.get(path)?.restated ?? []);
		if (rewritten.paths.length === 0) continue;
		for (const path of rewritten.paths) seen.add(path);
		out.set(file, rewritten.text);
	}
	for (const kind of p.kinds.values())
		if (kind.restated.length > 0 && !seen.has(kind.path)) throw new Error(`vocabulary: ${kind.path} restates ${kind.restated.join(', ')}, and no SubKindOf heritage declares it`);
	return out;
}

function restatedTests(dir: string, source: VocabularySource, p: Plan): Map<string, string> {
	const unfitFile = join(dir, UNFIT_RESTATED);
	const unfit: UnfitRestated = existsSync(unfitFile) ? JSON.parse(readFileSync(unfitFile, 'utf8')) : {};
	const featuresOf = composedFeatures(source);
	const checked = new Set<string>();
	const out = new Map<string, string>();
	for (const grammar of bindingGrammars()) {
		const composition = compositionOf(grammar);
		if (!source.compositions.has(composition)) continue;
		const composed = featuresOf(composition);
		for (const [path, names] of restatedChecks(p, composed)) for (const name of names) checked.add(`${path} ${name}`);
		const pkg = grammarPackageDir(grammar as GrammarName);
		const test = join(pkg, 'tests', RESTATED_TEST);
		out.set(
			relative(dir, test),
			restatedTest(p, {
				map: grammarMapName(grammar),
				vocabularyModule: relative(dirname(test), join(dir, 'index.ts')),
				mapModule: relative(dirname(test), join(pkg, 'src', PORTABLE_MAP_FILE)),
				composed,
				unfit
			})
		);
	}
	for (const [path, names] of Object.entries(unfit))
		for (const name of Object.keys(names)) {
			if (p.kinds.get(path)?.restated.includes(name) !== true) throw new Error(`${UNFIT_RESTATED}: ${path} restates no ${name}`);
			if (!checked.has(`${path} ${name}`)) throw new Error(`${UNFIT_RESTATED}: no grammar composes ${path}'s ${name}, so no test checks it`);
		}
	return out;
}

const stale = (dir: string, files: ReadonlyMap<string, string>): [string, string][] =>
	[...files].filter(([file, text]) => !existsSync(join(dir, file)) || readFileSync(join(dir, file), 'utf8') !== text);

export function drift(dir: string, files: ReadonlyMap<string, string>): string[] {
	return stale(dir, files).map(([file]) => `${file}: not what the feature folders generate; run sittir tool vocabulary-features --write`);
}

export async function vocabularyFeatureIssues(dir: string = VOCABULARY_DIR): Promise<string[]> {
	const { plan: p, files } = await generate(dir);
	return p.issues.length > 0 ? [...p.issues] : drift(dir, files);
}

export async function run(options: VocabularyFeaturesOptions = {}): Promise<number> {
	const dir = options.dir ?? VOCABULARY_DIR;
	const { plan: p, files } = await generate(dir);
	const owned = [...p.owned.values()].reduce((n, slots) => n + slots.size, 0);
	const added = [...p.kinds.values()].filter((k) => k.feature !== undefined).length;
	const restated = [...p.kinds.values()].reduce((n, k) => n + k.restated.length, 0);
	console.log(
		`${p.features.size} features add ${added} kinds and own ${owned} slots; ${p.kinds.size} kinds in ${p.levels.size} levels restate ${restated} slots`
	);
	for (const note of p.notes) console.log(`note: ${note}`);
	if (p.issues.length > 0) {
		for (const issue of p.issues) console.error(issue);
		return 1;
	}
	if (options.write) {
		for (const [file, text] of stale(dir, files)) writeFileSync(join(dir, file), text);
		return 0;
	}
	if (options.check) {
		const issues = drift(dir, files);
		for (const issue of issues) console.error(issue);
		return issues.length > 0 ? 1 : 0;
	}
	return 0;
}
