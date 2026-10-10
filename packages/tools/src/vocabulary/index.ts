import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatSource } from '@sittir/codegen/run-codegen';
import { type Plan, type ValueSet, plan } from './plan.ts';
import { AUGMENTATION, readVocabularySource, VOCABULARY_DIR } from './read.ts';
import { augmentation, FEATURES_INDEX, featuresIndex } from './write.ts';

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
	const source = readVocabularySource(dir);
	const p = plan(source);
	const files = new Map<string, string>();
	if (p.issues.length > 0) return { plan: p, files };
	files.set(AUGMENTATION, await formatSource(join(dir, AUGMENTATION), augmentation(source, p)));
	files.set(FEATURES_INDEX, await formatSource(join(dir, FEATURES_INDEX), featuresIndex(p)));
	return { plan: p, files };
}

export function drift(dir: string, files: ReadonlyMap<string, string>): string[] {
	return [...files]
		.filter(([file, text]) => !existsSync(join(dir, file)) || readFileSync(join(dir, file), 'utf8') !== text)
		.map(([file]) => `${file}: not what the feature folders generate; run sittir tool vocabulary-features --write`);
}

export async function vocabularyFeatureIssues(dir: string = VOCABULARY_DIR): Promise<string[]> {
	const { plan: p, files } = await generate(dir);
	return p.issues.length > 0 ? [...p.issues] : drift(dir, files);
}

export function vocabularyValueSets(dir: string = VOCABULARY_DIR): ReadonlyMap<string, ValueSet> {
	return plan(readVocabularySource(dir)).valueSets;
}

export async function run(options: VocabularyFeaturesOptions = {}): Promise<number> {
	const dir = options.dir ?? VOCABULARY_DIR;
	const { plan: p, files } = await generate(dir);
	const owned = [...p.owned.values()].reduce((n, members) => n + members.size, 0);
	const added = [...p.kinds.values()].filter((k) => k.feature !== undefined).length;
	console.log(
		`${p.features.size} features add ${added} kinds and own ${owned} members; ${p.kinds.size} kinds and ${p.values.size} value refinements in ${p.levels.size} levels`
	);
	for (const note of p.notes) console.log(`note: ${note}`);
	if (p.issues.length > 0) {
		for (const issue of p.issues) console.error(issue);
		return 1;
	}
	if (options.write) {
		for (const [file, text] of files) writeFileSync(join(dir, file), text);
		return 0;
	}
	if (options.check) {
		const issues = drift(dir, files);
		for (const issue of issues) console.error(issue);
		return issues.length > 0 ? 1 : 0;
	}
	return 0;
}
