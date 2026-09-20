export type DogfoodSurface = 'strict' | 'loose';

export interface DogfoodTarget {
	readonly grammar: 'rust' | 'typescript' | 'python';
	readonly source: string;
	readonly stem: string;
	readonly name: string;
	readonly surfaces: readonly DogfoodSurface[];
	readonly rendered: string;
}

export interface DogfoodRebuild extends Omit<DogfoodTarget, 'surfaces'> {
	readonly surface: DogfoodSurface;
	readonly exportName: string;
	readonly file: string;
}

export const DOGFOOD_TARGETS: readonly DogfoodTarget[] = [
	{
		grammar: 'rust',
		source: 'rust/crates/sittir-core/src/splice.rs',
		stem: '17-dogfood-rust',
		name: 'Splice',
		surfaces: ['strict', 'loose'],
		rendered: 'dogfood-rust.rendered'
	},
	{
		grammar: 'typescript',
		source: 'packages/common/src/format.ts',
		stem: '18-dogfood-typescript',
		name: 'Format',
		surfaces: ['strict', 'loose'],
		rendered: 'dogfood-typescript.rendered'
	},
	{
		grammar: 'python',
		source: 'tests/format-roundtrip/fixtures/python-4space.py',
		stem: '19-dogfood-python',
		name: 'Python4space',
		surfaces: ['strict', 'loose'],
		rendered: 'dogfood-python.rendered'
	},
	{
		grammar: 'rust',
		source: 'packages/tools/tests/emit/__fixtures__/keyword-openers.rs',
		stem: '20-keyword-openers-rust',
		name: 'KeywordOpenersRust',
		surfaces: ['strict'],
		rendered: 'keyword-openers-rust.rendered'
	},
	{
		grammar: 'typescript',
		source: 'packages/tools/tests/emit/__fixtures__/keyword-openers.ts',
		stem: '20-keyword-openers-typescript',
		name: 'KeywordOpenersTypescript',
		surfaces: ['strict'],
		rendered: 'keyword-openers-typescript.rendered'
	},
	{
		grammar: 'python',
		source: 'packages/tools/tests/emit/__fixtures__/keyword-openers.py',
		stem: '20-keyword-openers-python',
		name: 'KeywordOpenersPython',
		surfaces: ['strict'],
		rendered: 'keyword-openers-python.rendered'
	}
];

const SUFFIX: Record<DogfoodSurface, { readonly exportName: string; readonly file: string }> = {
	strict: { exportName: 'Generated', file: '.generated.ts' },
	loose: { exportName: 'Loose', file: '-loose.generated.ts' }
};

export const DOGFOOD_REBUILDS: readonly DogfoodRebuild[] = DOGFOOD_TARGETS.flatMap(({ surfaces, ...target }) =>
	surfaces.map((surface) => ({
		...target,
		surface,
		exportName: `rebuild${target.name}${SUFFIX[surface].exportName}`,
		file: `examples/${target.stem}${SUFFIX[surface].file}`
	}))
);
