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
	return ir.program.from({
		statements: [
			ir.interfaceDeclaration.from({
				name: 'IsGuards',
				body: {
					members: grammar.kinds.map((kind) =>
						ir.propertySignature.from({
							name: `is${pascalCase(kind)}`,
							type: { type: 'boolean' },
						}),
					),
				},
			}),
		],
	}).$render();
}
