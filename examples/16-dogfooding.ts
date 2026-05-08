import { snippets, template, ir } from '@sittir/typescript';

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
	const guards = grammar.kinds.map((kind) =>
		snippets.typeGuard
			.fill({
				NAME: ir.identifier(`is${pascalCase(kind)}`),
				TYPE: ir.typeReference(pascalCase(kind)),
				KIND: ir.stringLiteral(kind)
			})
			.render()
	);

	const dispatchObj = template('export const is = { $...ENTRIES }')
		.fill({
			ENTRIES: grammar.kinds.map((kind) => ir.shorthandPropertyAssignment(ir.identifier(`is${pascalCase(kind)}`)))
		})
		.render();

	return [...guards, dispatchObj].join('\n\n');
}
