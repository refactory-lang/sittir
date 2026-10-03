import type {
	ApiOf,
	Engine,
	ErrorNode,
	ErrorRegion,
	Language,
	LanguageAPI,
	LanguageHooks,
	ParsedRoot,
	StrictSurface,
	TriviaSetter,
	Types
} from '../src/index.ts';

interface FakeNode {
	readonly $type: 1;
}
interface EmptyFake extends FakeNode {
	readonly empty: true;
}
interface NoEmptyForm {
	readonly $type: 2;
}
interface StrictNode extends FakeNode {
	readonly strict: true;
}
interface FakeAPI extends LanguageAPI {
	readonly name: 'fake';
	readonly build: {
		leaf: ((text: string) => FakeNode) & { strict(text: string): StrictNode; coerce(text: string): FakeNode };
		number: { bigint: ((v: bigint) => FakeNode) & { strict(v: bigint): StrictNode } };
	};
	readonly is: { leaf(n: unknown): n is FakeNode };
	readonly kinds: { readonly Leaf: 1 };
	readonly types: { readonly leaf: FakeNode };
	readonly root: FakeNode & ParsedRoot;
	readonly node: FakeNode;
	readonly options: { readonly indent?: string };
	readonly empty: { readonly node: FakeNode; readonly empty: EmptyFake };
}

type API = ApiOf<Language<FakeAPI>>;

// An engine's recorded language names the same API.
declare const recorded: Engine<API>['language'];
export const sameApi: ApiOf<typeof recorded> = null as unknown as API;

export const leaf: Types<Engine<API>>['leaf'] = { $type: 1 };

// @ts-expect-error a kind the language doesn't have
export type Missing = Types<Engine<API>>['missing'];

export const strictTypes: Types<Engine<API, 'strict'>>['leaf'] = { $type: 1 };

export const descriptor: Language<FakeAPI> = {
	name: 'fake',
	fileTypes: [],
	load: async (): Promise<LanguageHooks<FakeAPI>> => {
		throw new Error('type-only');
	},
	createEngine: async () => {
		throw new Error('type-only');
	}
};

declare const strict: StrictSurface<FakeAPI['build']>;
export const strictLeaf: StrictNode = strict.leaf('a');
export const strictVariant: StrictNode = strict.number.bigint(1n);
// @ts-expect-error the strict surface hides the flavours
export const hidden = strict.leaf.strict;

declare const portable: Engine<API, 'portable'>;
export const noBuild: never = portable.build;

declare const engine: Engine<API>;
export const rendered: string = engine.render((b) => b.leaf('a')).toString();
// @ts-expect-error render options are the language's options
engine.render(leaf, { indnet: '\t' });

interface OtherNode {
	readonly $type: 2;
}
interface OtherAPI extends LanguageAPI {
	readonly name: 'other';
	readonly build: { leaf(text: string): OtherNode };
	readonly is: object;
	readonly kinds: object;
	readonly types: { readonly leaf: OtherNode };
	readonly root: OtherNode & ParsedRoot;
	readonly node: OtherNode;
	readonly options: object;
}
declare const other: Engine<OtherAPI>;
// @ts-expect-error a node of another language
engine.render(other.build.leaf('a'));
// @ts-expect-error a build callback returning another language's node
engine.render(() => other.build.leaf('a'));

declare const guardEngine: Engine<API>;
declare const unknownValue: unknown;
if (guardEngine.isNode(unknownValue)) unknownValue satisfies FakeNode;
if (guardEngine.isParsedNode(unknownValue)) unknownValue satisfies FakeNode;
if (guardEngine.isFactoryNode(unknownValue)) unknownValue satisfies FakeNode;
if (guardEngine.isErrorNode(unknownValue)) unknownValue satisfies FakeNode;

declare const fakeNode: FakeNode;
if (guardEngine.isEmptyNode(fakeNode)) fakeNode satisfies EmptyFake;

declare const noEmptyForm: NoEmptyForm;
// @ts-expect-error a kind the language's empty map does not name has no empty form
guardEngine.isEmptyNode(noEmptyForm);

// A parsed root always lists the regions that did not parse.
declare const parsing: Engine<API>;
export const parsedErrors: readonly ErrorRegion[] = parsing.parse('').$errors;
export const thrown = parsing.parse('', { errors: 'throw' });
// @ts-expect-error the errors option has only the throwing mode
export const reported = parsing.parse('', { errors: 'report' });

// A trivia position holds the grammar's trivia nodes and the ERROR nodes read there, and takes them back.
declare const trivia: TriviaSetter<FakeNode, NoEmptyForm>;
declare const errorNode: ErrorNode;
export const triviaItems: readonly (NoEmptyForm | ErrorNode)[] = trivia.leading();
export const reattached: FakeNode = trivia.trailing(errorNode);
