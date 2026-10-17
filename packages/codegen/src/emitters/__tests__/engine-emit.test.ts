import { describe, expect, it } from 'vitest';
import { emitApi, emitRenderEngine } from '../engine.ts';
import { languageApiName } from '../../grammars.ts';
import { emitDescriptor, emitIndex } from '../index-file.ts';

describe('emitRenderEngine', () => {
	const output = emitRenderEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });

	it('imports from @sittir/common/engine', () => {
		expect(output).toContain("from '@sittir/common/engine'");
	});

	it('throws when native engine is unavailable (no JS-engine fallback)', () => {
		const ts = emitRenderEngine({ grammar: 'typescript', rootTypeName: 'Program', rootTreeTypeName: 'ProgramTree' });
		expect(ts).not.toContain('createJsEngine');
		expect(ts).toContain('createNativeEngine<');
		expect(ts).toContain('throw new Error');
	});

	it('does not thread deprecated native node projection through createNativeEngine', () => {
		expect(output).not.toContain("import { toNativeRenderNode } from './utils.js'");
		expect(output).not.toContain('toNativeRenderNode,');
	});

	it('types the diagnostics root as the data projection of the root kind', () => {
		expect(output).toContain('export type SourceFileRoot = UntypedNodeOf<SourceFile>;');
		expect(output).toContain("import type { IndentOption, NativeEngineOptions, UntypedNodeOf } from '@sittir/types';");
		expect(output).not.toContain('AnyUntypedNode &');
	});

	// Constructed nodes carry `$render()`, so `factories -> utils -> boundary`
	// reaches the render engine; a `wrap.js` import here would close a cycle
	// back onto `factories.js` and leave module init reading half-built exports.
	it('imports no wrapper', () => {
		expect(output).not.toContain("from './wrap.js'");
		expect(output).not.toContain('wrapNode');
		expect(output).not.toContain('parseAndRead');
	});
});

describe('emitApi', () => {
	const output = emitApi({ grammar: 'python', rootTypeName: 'Module', rootTreeTypeName: 'ModuleTree' });

	it('names the language API after the grammar', () => {
		expect(languageApiName('python')).toBe('PythonAPI');
		expect(output).toContain('export interface PythonAPI extends LanguageAPI {');
		expect(output).toContain("readonly name: 'python';");
		expect(output).toContain('readonly node: PythonNode;');
		expect(output).toContain('readonly root: ModuleTree;');
	});

	it("types the API's empty forms from the grammar's type map", () => {
		expect(output).toContain("readonly empty: PythonTypeMap['empty'];");
		expect(output).toMatch(/import type \{[^}]*\bPythonTypeMap\b[^}]*\} from '\.\/types\.js';/);
	});

	it('keys the kind-to-type map on the stamped ir keys', () => {
		expect(output).toContain('readonly types: KindTypes<TypeKeyOf, NamespaceMap>;');
	});

	it('wires the hooks through the shared native adapter and the wrapper', () => {
		expect(output).toContain('export const hooks: LanguageHooks<PythonAPI> = Object.freeze<LanguageHooks<PythonAPI>>({');
		expect(output).toContain('createNative: (options) => nativeLanguageEngine<PythonAPI, IndentChar>(createRenderEngine(options)),');
		expect(output).toContain('wrap: (root, tree) => wrapNode(root as ModuleRoot & ParsedRoot, tree as TreeHandle)');
		expect(output).toContain('trivia: triviaFacts,');
		expect(output).not.toContain('coerce.js');
	});

	it('carries the comment builder in the trivia hook when the grammar has a comment coercer', () => {
		const withComment = emitApi({
			grammar: 'python',
			rootTypeName: 'Module',
			rootTreeTypeName: 'ModuleTree',
			commentCoercer: 'coerceToComment'
		});
		expect(withComment).toContain('trivia: Object.freeze({ ...triviaFacts, comment: coerceToComment }),');
		expect(withComment).toContain("import { coerceToComment } from './factories/coerce.js';");
	});

	it('declares and hands over the portable surface and the flag table only for a grammar with bindings', () => {
		expect(output).not.toContain('portable');
		expect(output).not.toContain('queryFlags');
		const bound = emitApi({ grammar: 'python', rootTypeName: 'Module', rootTreeTypeName: 'ModuleTree', portable: true });
		expect(bound).toContain("import { portable, queryFlags, querySlotFlags } from './portable.js';");
		expect(bound).toContain('readonly portable: typeof portable;');
		expect(bound).toContain('\tportable,\n\tqueryFlags,\n\tquerySlotFlags\n});');
	});

	it("hands the engine the package's render module hash", () => {
		expect(output).toContain("import { RENDER_MODULE_HASH } from './hash.js';");
		expect(output).toContain('renderModuleHash: RENDER_MODULE_HASH,');
	});
});

describe('emitDescriptor', () => {
	it('carries no file types for a grammar whose model has none', () => {
		expect(emitDescriptor({ grammar: 'regex', nodeMap: { fileTypes: [] } as never })).toContain('export const fileTypes: readonly string[] = Object.freeze([]);');
	});

	const output = emitDescriptor({ grammar: 'rust', nodeMap: { fileTypes: ['rs'] } as never });

	it('exports the descriptor as values: its kind ids, its language-checked guards, and the api loaded on demand', () => {
		expect(output).toContain("export const name = 'rust';");
		expect(output).toContain('export const fileTypes: readonly string[] = Object.freeze(["rs"]);');
		expect(output).toContain('export const kinds = TSKindId;');
		expect(output).toContain('export const is = languageGuards(guards, rust);');
		expect(output).toContain("export const load: Language<RustAPI>['load'] = () => import('./api.js').then((m) => m.hooks);");
		expect(output).toContain("export const createEngine: Language<RustAPI>['createEngine'] = (options) => import('@sittir/common').then((m) => m.createEngine(rust, options));");
		expect(output).toContain('void (rust satisfies Language<RustAPI>);');
	});

	it('loads at import only the kind ids, the guards, the language check and itself', () => {
		const runtime = output.split('\n').filter((line) => line.startsWith('import ') && !line.startsWith('import type '));
		expect(runtime).toEqual([
			"import { languageGuards } from '@sittir/common/language';",
			"import * as rust from './descriptor.js';",
			"import { TSKindId } from './kinds.js';",
			"import { is as guards } from './is.js';"
		]);
	});

	it('exports the language\'s types and its engine type from the same module', () => {
		expect(output).toContain("export type * from './types.js';");
		expect(output).toContain("export type { RustAPI } from './api.js';");
		expect(output).toContain("export type Engine<M extends ApiSurface = 'default'> = EngineOf<RustAPI, M>;");
	});
});

describe('emitIndex', () => {
	it('exports the descriptor module as the default, and its types by name', () => {
		expect(emitIndex()).toBe("// Auto-generated by @sittir/codegen — do not edit\n\nexport * as default from './descriptor.js';\nexport type * from './descriptor.js';\n");
	});
});
