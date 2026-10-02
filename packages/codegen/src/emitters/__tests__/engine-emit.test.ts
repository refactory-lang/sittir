import { describe, expect, it } from 'vitest';
import { emitApi, emitRenderEngine } from '../engine.ts';
import { languageApiName } from '../../grammars.ts';
import { emitIndex } from '../index-file.ts';

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

	it('does not thread deprecated native transport projection through createNativeEngine', () => {
		expect(output).not.toContain("import { toNativeRenderTransport } from './utils.js'");
		expect(output).not.toContain('toNativeRenderTransport,');
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
		expect(output).toMatch(/import \{[^}]*type PythonTypeMap[^}]*\} from '\.\/types\.js';/);
	});

	it('keys the kind-to-type map on the stamped ir keys', () => {
		expect(output).toContain('readonly types: KindTypes<IrKeyOf, NamespaceMap>;');
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

	it("hands the engine the package's render module hash", () => {
		expect(output).toContain("import { RENDER_MODULE_HASH } from './hash.js';");
		expect(output).toContain('renderModuleHash: RENDER_MODULE_HASH,');
	});
});

describe('emitIndex', () => {
	it('carries no file types for a grammar whose model has none', () => {
		expect(emitIndex({ grammar: 'regex', nodeMap: { fileTypes: [] } as never })).toContain("fileTypes: [],");
	});

	const output = emitIndex({ grammar: 'rust', nodeMap: { fileTypes: ['rs'] } as never });

	it('exports the language descriptor as the default, loading the api on demand', () => {
		expect(output).toContain('const rust: Language<RustAPI> = {');
		expect(output).toContain(`\tfileTypes: ["rs"],`);
		expect(output).toContain("\tload: () => import('./api.js').then((m) => m.hooks),");
		expect(output).toContain("\tcreateEngine: (options) => import('@sittir/common').then((m) => m.createEngine(rust, options))");
		expect(output).toContain('export default rust;');
		expect(output).toContain("export type { RustAPI } from './api.js';");
	});

	it('imports the api for its type only', () => {
		expect(output).toContain("import type { RustAPI } from './api.js';");
		expect(output).not.toMatch(/^import \{[^}]*\} from '\.\/api\.js'/m);
	});

	it('re-exports types only, besides the descriptor', () => {
		const valueExports = output
			.split('\n')
			.filter((line) => line.startsWith('export ') && !line.startsWith('export type '));
		expect(valueExports).toEqual(['export default rust;']);
	});
});
