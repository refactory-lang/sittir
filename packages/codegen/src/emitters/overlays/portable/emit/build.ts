import { loadPinnedBuild } from '../../../../bootstrap/pinned.ts';
import type { PortableBuildArm, PortableBuildPath, PortableBuildTable } from '../../../../../../types/src/portable-build.ts';
import type { PinnedBuilders } from './engine.ts';
import type { PortableEmitDiagnostic, PortableEmitInput, PortableEmitOutput } from '../emit-input.ts';

type B = PinnedBuilders;
type Built<F> = F extends (...args: never[]) => infer R ? R : never;
type Expression =
	| Built<B['identifier']>
	| Built<B['memberExpression']>
	| Built<B['callExpressionCall']>
	| Built<B['stringSingle']>
	| Built<B['object']>
	| Built<B['arrowFunction']['callSignature']>;
type Statement = Built<B['returnStatement']> | Built<B['lexicalDeclaration']>;
type TypeNode = string | Built<B['genericType']> | Built<B['literalType']>;

const identifierOf = (path: string): string => path.replace(/\./g, '_');

interface Trie {
	path?: string;
	readonly children: Map<string, Trie>;
}

export function emitPortableModule(t: B, input: PortableEmitInput<PortableBuildTable>): { readonly program: ReturnType<B['program']>; readonly diagnostics: readonly PortableEmitDiagnostic[] } {
	const { table } = input;
	const diagnostics: PortableEmitDiagnostic[] = [];
	const id = (name: string) => t.identifier(name);
	const dot = (object: Expression, property: string) => t.memberExpression({ object, operator: '.', property });
	const call = (callee: Expression, ...args: Expression[]) => t.callExpressionCall({ function: callee, arguments: t.arguments(...args) });
	const builderRef = (builder: string): Expression => builder.split('.').reduce<Expression>((object, property) => dot(object, property), id('b'));
	const str = (text: string) => t.stringSingle(text);
	const ret = (value?: Expression) => t.returnStatement(value);
	const block = (...statements: Statement[]) => t.statementBlock(...statements);
	const constant = (name: string, value: Expression) => t.lexicalDeclaration({ kind: 'const', declarators: [t.variableDeclaratorPlain({ name, value })] });
	const typeRef = (name: string, first: TypeNode, ...rest: TypeNode[]) => t.genericType({ name, typeArguments: t.typeArguments(first, ...rest) });
	const pathType = (path: string) => typeRef('BuildInput', input.map, t.literalType(str(path)));
	const arrow = (name: string, type: TypeNode, body: ReturnType<B['statementBlock']>) =>
		t.arrowFunction.callSignature({ parameters: t.formalParameters(t.requiredParameter({ name, type: t.typeAnnotation(type) })), body });
	const shapeOf = (builder: string) => table.builders[builder];

	const unfit = (path: string, message: string): undefined => {
		diagnostics.push({ code: 'portable-emit-unfit-member', path, message });
		return undefined;
	};
	const armFunctions = new Map<string, Statement>();
	const armBody = (path: string, arm: PortableBuildArm): Statement[] | undefined => {
		if (arm.builder === undefined) return unfit(path, `arm ${arm.kind} builds through its holder`);
		const shape = shapeOf(arm.builder);
		if (shape === 'constant' || shape === 'nullary') return [ret(call(builderRef(arm.builder)))];
		return unfit(path, `arm ${arm.kind}'s builder ${arm.builder} takes a ${shape} input, which is not compiled yet`);
	};
	const armName = (path: string, row: PortableBuildPath, arm: PortableBuildArm): string | undefined => {
		const name = row.root && row.arms.length === 1 ? identifierOf(path) : `${identifierOf(path)}$${arm.kind}`;
		if (armFunctions.has(name)) return name;
		const body = armBody(path, arm);
		if (body === undefined) return undefined;
		armFunctions.set(name, constant(name, arrow('input', pathType(path), block(...body))));
		return name;
	};

	const root: Trie = { children: new Map() };
	for (const [path, row] of Object.entries(table.paths).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
		if (!row.root) continue;
		if (row.arms.length !== 1) {
			unfit(path, `${row.arms.length} arms, whose pick is not compiled yet`);
			continue;
		}
		if (armName(path, row, row.arms[0]!) === undefined) continue;
		let node = root;
		for (const segment of path.split('.')) {
			let next = node.children.get(segment);
			if (next === undefined) node.children.set(segment, (next = { children: new Map() }));
			node = next;
		}
		node.path = path;
	}
	const surface = (node: Trie): Expression => {
		const children = t.object(...[...node.children].map(([segment, child]) => t.pair({ key: segment, value: surface(child) })));
		if (node.path === undefined) return children;
		return node.children.size === 0 ? id(identifierOf(node.path)) : call(dot(id('Object'), 'assign'), id(identifierOf(node.path)), children);
	};
	const typeImport = (names: readonly string[], source: string) =>
		t.importStatement.clauseFrom({ typeKeyword: 'type', importClause: t.importClause(t.namedImports(...names.map((name) => t.importSpecifier.name({ name })))), source: str(source) });
	const built = armFunctions.size > 0;
	const program = t.program({
		statements: [
			typeImport(['Engine'], '@sittir/types'),
			...(built ? [typeImport(['BuildInput'], input.imports.vocabulary)] : []),
			typeImport([input.api], input.imports.api),
			...(built ? [typeImport([input.map], input.imports.map)] : []),
			t.exportStatementDefaultDeclaration({
				content: t.functionDeclaration({
					name: 'portableBuild',
					parameters: t.formalParameters(t.requiredParameter({ name: built ? 'engine' : '_engine', type: t.typeAnnotation(typeRef('Engine', input.api)) })),
					body: block(...(built ? [constant('b', dot(id('engine'), 'build'))] : []), ...armFunctions.values(), ret(surface(root)))
				})
			})
		]
	});
	return { program, diagnostics };
}

export async function emitPortableBuildInProcess(input: PortableEmitInput<PortableBuildTable>): Promise<PortableEmitOutput> {
	const pinned = await loadPinnedBuild();
	using engine = await pinned.common.createEngine(pinned.typescript.default);
	const { program, diagnostics } = emitPortableModule(engine.build, input);
	return { text: String(engine.render(program)), diagnostics };
}

