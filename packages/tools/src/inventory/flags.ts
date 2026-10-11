import typescript from '@sittir/typescript';
import { Delimiter } from '@sittir/common/utils';
import { REGENERATE_BINDINGS_COMMAND, flagMembers } from '@sittir/codegen/bindings';

export async function printFlagsModule(names: Iterable<string>): Promise<string> {
	const ts = await typescript.createEngine({ render: { layout: { indent: '\t' } } });
	const { build } = ts;
	const members = flagMembers(names).map(({ name, bit }) =>
		build.enumAssignment.strict({
			name: build.identifier(name),
			value: build.binaryExpression.strict({
				left: build.number.decimal('1'),
				operator: ts.kinds.LtLt,
				right: build.number.decimal(String(bit))
			})
		})
	);
	const [first, ...rest] = members;
	const program = build.program.strict({
		statements: [
			build.exportStatementDefaultDeclaration
				.strict({
					content: build.enumDeclaration.strict({
						name: build.identifier('Flags'),
						body: first === undefined ? build.enumBody.strict() : build.enumBody.strict(build.enumBodyElements.strict({ delimiter: Delimiter.None }, first, ...rest))
					})
				})
				.$trivia.leading(
					build.commentLine(` Generated from the vocabulary's Flag declarations by \`${REGENERATE_BINDINGS_COMMAND}\`. Do not edit.`)
				)
		]
	});
	return ts.render(program).toString();
}
