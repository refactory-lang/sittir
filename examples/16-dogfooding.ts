import { ir } from '@sittir/typescript';

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
		ir.propertySignature({
			name: `is${pascalCase(kind)}`,
			type: { type: 'boolean' },
		}),
	);
	return ir.program({
		statements: [
			ir.interfaceDeclaration({
				name: 'IsGuards',
				body: ir.objectType.curly(first === undefined ? {} : { members: ir.objectTypeContent(first, ...rest) }),
			}),
		],
	}).$render();
}
