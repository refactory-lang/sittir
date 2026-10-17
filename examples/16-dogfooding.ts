import typescript from '@sittir/typescript';

const ts = await typescript.createEngine();

interface GrammarModel {
	kinds: string[];
}

function pascalCase(value: string) {
	return value
		.split(/[_-]/u)
		.filter(Boolean)
		.map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
		.join('');
}

export function emitIsModule(grammar: GrammarModel): string {
	const [first, ...rest] = grammar.kinds.map((kind) =>
		ts.build.propertySignature({
			name: `is${pascalCase(kind)}`,
			type: { type: 'boolean' },
		}),
	);
	return ts.build.program({
		statements: [
			ts.build.interfaceDeclaration({
				name: 'IsGuards',
				body: ts.build.objectType.curly(first === undefined ? {} : { members: ts.build.objectTypeContent(first, ...rest) }),
			}),
		],
	}).$render();
}
