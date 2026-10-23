import type { LanguageApis } from '../languages.ts';

export type DogfoodSurface = 'strict' | 'loose';

interface DogfoodTargetOf<G extends keyof LanguageApis> {
	readonly grammar: G;
	readonly source: string;
	readonly stem: string;
	readonly name: string;
	readonly surfaces: readonly DogfoodSurface[];
	readonly rendered: string;
	readonly renderOptions?: LanguageApis[G]['options'];
}

export type DogfoodTarget = { readonly [G in keyof LanguageApis]: DogfoodTargetOf<G> }[keyof LanguageApis];

export type DogfoodRebuild = DogfoodTarget extends infer T
	? T extends DogfoodTarget
		? Omit<T, 'surfaces'> & { readonly surface: DogfoodSurface; readonly exportName: string; readonly file: string }
		: never
	: never;

export const DOGFOOD_TARGETS: readonly DogfoodTarget[] = [
	{
		grammar: 'rust',
		source: 'packages/tools/tests/emit/__fixtures__/dogfood-rust.rs',
		stem: '17-dogfood-rust',
		name: 'Splice',
		surfaces: ['strict', 'loose'],
		rendered: 'dogfood-rust.rendered'
	},
	{
		grammar: 'typescript',
		source: 'packages/tools/tests/emit/__fixtures__/dogfood-typescript.ts',
		stem: '18-dogfood-typescript',
		name: 'Format',
		surfaces: ['strict', 'loose'],
		rendered: 'dogfood-typescript.rendered',
		renderOptions: { layout: { indent: '\t' } }
	},
	{
		grammar: 'python',
		source: 'tests/format-roundtrip/fixtures/python-4space.py',
		stem: '19-dogfood-python',
		name: 'Python4space',
		surfaces: ['strict', 'loose'],
		rendered: 'dogfood-python.rendered'
	}
];

export const EMITTER_FIXTURE_TARGETS: readonly DogfoodTarget[] = [
	{
		grammar: 'rust',
		source: 'packages/tools/tests/emit/__fixtures__/keyword-openers.rs',
		stem: 'keyword-openers-rust',
		name: 'KeywordOpenersRust',
		surfaces: ['strict', 'loose'],
		rendered: 'keyword-openers-rust.rendered'
	},
	{
		grammar: 'typescript',
		source: 'packages/tools/tests/emit/__fixtures__/keyword-openers.ts',
		stem: 'keyword-openers-typescript',
		name: 'KeywordOpenersTypescript',
		surfaces: ['strict', 'loose'],
		rendered: 'keyword-openers-typescript.rendered'
	},
	{
		grammar: 'python',
		source: 'packages/tools/tests/emit/__fixtures__/keyword-openers.py',
		stem: 'keyword-openers-python',
		name: 'KeywordOpenersPython',
		surfaces: ['strict', 'loose'],
		rendered: 'keyword-openers-python.rendered'
	},
	{
		grammar: 'rust',
		source: 'packages/tools/tests/emit/__fixtures__/list-seat-configs.rs',
		stem: 'list-seat-configs-rust',
		name: 'ListSeatConfigsRust',
		surfaces: ['strict', 'loose'],
		rendered: 'list-seat-configs-rust.rendered'
	},
	{
		grammar: 'rust',
		source: 'packages/tools/tests/emit/__fixtures__/trivia.rs',
		stem: 'trivia-rust',
		name: 'TriviaRust',
		surfaces: ['strict', 'loose'],
		rendered: 'trivia-rust.rendered'
	},
	{
		grammar: 'typescript',
		source: 'packages/tools/tests/emit/__fixtures__/trivia.ts',
		stem: 'trivia-typescript',
		name: 'TriviaTypescript',
		surfaces: ['strict', 'loose'],
		rendered: 'trivia-typescript.rendered'
	}
];

const SUFFIX: Record<DogfoodSurface, { readonly exportName: string; readonly file: string }> = {
	strict: { exportName: 'Generated', file: '.generated.ts' },
	loose: { exportName: 'Loose', file: '-loose.generated.ts' }
};

export interface RebuildSet {
	readonly dir: string;
	readonly typeCheckScript: string;
	readonly ceiling: string;
	readonly targets: readonly DogfoodTarget[];
}

export const REBUILD_SETS: readonly RebuildSet[] = [
	{
		dir: 'examples',
		typeCheckScript: 'type-check:generated-examples',
		ceiling: 'examples/generated-typecheck-ceiling.json',
		targets: DOGFOOD_TARGETS
	},
	{
		dir: 'packages/tools/tests/emit/__generated__',
		typeCheckScript: 'type-check:emit-fixtures',
		ceiling: 'packages/tools/tests/emit/__generated__/generated-typecheck-ceiling.json',
		targets: EMITTER_FIXTURE_TARGETS
	}
];

export const GENERATED_REBUILDS: readonly DogfoodRebuild[] = REBUILD_SETS.flatMap(({ dir, targets }) =>
	targets.flatMap(({ surfaces, ...target }) =>
		surfaces.map((surface) => ({
			...target,
			surface,
			exportName: `rebuild${target.name}${SUFFIX[surface].exportName}`,
			file: `${dir}/${target.stem}${SUFFIX[surface].file}`
		}))
	)
);
