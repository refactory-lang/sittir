import type {
	ArbitraryPrecisionIntegers,
	AsyncAwait,
	AsyncBlocks,
	ByteStrings,
	Characters,
	CoerciveEquality,
	ComplexNumbers,
	ComputedKeys,
	Coroutines,
	Encapsulation,
	Generators,
	HigherRankPolymorphism,
	InterfaceConformance,
	ManifestTyping,
	Methods,
	MultipleInheritance,
	ParametricPolymorphism,
	RegularExpressions,
	SingleInheritance,
	StringInterpolation,
	TypeAnnotations,
} from './vocabulary/features/index.ts';

/** JavaScript's features. TypeScript is these and its typing features. */
export interface JavaScriptFeatures
	extends AsyncAwait,
		Generators,
		SingleInheritance,
		Encapsulation,
		ComputedKeys,
		CoerciveEquality,
		ArbitraryPrecisionIntegers,
		RegularExpressions,
		StringInterpolation {}

export interface PythonFeatures
	extends AsyncAwait, Generators, MultipleInheritance, TypeAnnotations, ParametricPolymorphism, ArbitraryPrecisionIntegers, ComplexNumbers, ByteStrings, StringInterpolation {}

export interface RustFeatures extends AsyncBlocks, Coroutines, Methods, InterfaceConformance, ManifestTyping, HigherRankPolymorphism, Characters {}

export interface TypeScriptFeatures extends JavaScriptFeatures, TypeAnnotations, ParametricPolymorphism, InterfaceConformance {}

/**
 * Each language: the grammar whose bindings claims its context covers, and its terms. A language's composition is the
 * interface named `<Language>Features`. A term names a kind of the language in its own words: it replaces the path's
 * last segment, so Rust's `declaration.module` is also `declaration.mod`. JavaScript has no grammar here, so its
 * context covers TypeScript's claims, less those its composition lacks.
 */
export const languages = {
	python: { claims: 'python', terms: {} },
	rust: { claims: 'rust', terms: { 'declaration.module': 'mod' } },
	typescript: { claims: 'typescript', terms: {} },
	javascript: { claims: 'typescript', terms: {} },
} as const satisfies Record<string, { readonly claims: string; readonly terms: Readonly<Record<string, string>> }>;
