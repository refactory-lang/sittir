import { emitPrototype, writePrototype, type PrototypeGrammar } from './emit.ts';

const PATHS = ['attribute.decorator', 'declaration.property.getter', 'declaration.method', 'expression.collection.list', 'literal.number.integer', 'literal.number', 'statement.block', 'statement.return'];

const grammars: readonly Omit<PrototypeGrammar, 'table'>[] = [
	{ name: 'python', api: 'PythonAPI', map: 'PythonMap', paths: PATHS, presets: { 'declaration.property.getter': { parameters: ['self'] } } },
	{ name: 'typescript', api: 'TypescriptAPI', map: 'TypeScriptMap', paths: PATHS }
];

for (const grammar of grammars) {
	const { build } = (await import(`../../../../${grammar.name}/src/portable/build.ts`)) as { build: PrototypeGrammar['table'] };
	const result = await emitPrototype({ ...grammar, table: build });
	const file = writePrototype(grammar.name, result.text);
	console.log(`== ${grammar.name}: ${result.functions} functions, ${result.text.split('\n').length} lines, ${result.milliseconds.toFixed(0)} ms -> ${file}`);
	for (const diagnostic of result.diagnostics) console.log(`  gap: ${diagnostic}`);
}
