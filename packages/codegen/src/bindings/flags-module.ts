import { loadPinnedBuild } from '../bootstrap/pinned.ts';
import type { FlagMember } from './flags.ts';
import { REGENERATE_BINDINGS_COMMAND } from './hash.ts';

export async function flagsModuleInProcess(members: readonly FlagMember[]): Promise<string> {
	const { typescript, common, utils } = await loadPinnedBuild();
	const ts = await common.createEngine(typescript.default, { render: { layout: { indent: '\t' } } });
	const { build } = ts;
	const assignments = members.map(({ name, bit }) =>
		build.enumAssignment.strict({
			name: build.identifier(name),
			value: build.binaryExpression.strict({
				left: build.number.decimal('1'),
				operator: ts.kinds.LtLt,
				right: build.number.decimal(String(bit))
			})
		})
	);
	const [first, ...rest] = assignments;
	const body =
		first === undefined
			? build.enumBody.strict()
			: build.enumBody.strict(build.enumBodyElements.strict({ delimiter: utils.Delimiter.None }, first, ...rest));
	const program = build.program.strict({
		statements: [
			build.exportStatementDefaultDeclaration
				.strict({ content: build.enumDeclaration.strict({ name: build.identifier('Flags'), body }) })
				.$trivia.leading(
					build.commentLine(` Generated from the vocabulary's Flag declarations by \`${REGENERATE_BINDINGS_COMMAND}\`. Do not edit.`)
				)
		]
	});
	return ts.render(program).toString();
}
