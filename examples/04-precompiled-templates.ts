import { snippets, ir } from '@sittir/rust';

export function fillImplDisplaySnippet() {
	return snippets.implDisplay
		.fill({
			TYPE: ir.typeItem
			EXPR: ir.fieldExpression({
				value: ir.selfExpression(),
				field: ir.fieldIdentifier('host')
			})
		})
		.render();
}

export function fromImplDisplaySnippet() {
	return snippets.implDisplay
		.from({
			TYPE: 'Config',
			EXPR: ir.fieldExpression({
				value: ir.selfExpression(),
				field: ir.fieldIdentifier('host')
			})
		})
		.render();
}
