import { createEngine as createTsEngine, ir as tsIr, is, wrapNode } from '@sittir/typescript';
import { nodeText, parseSource } from './helpers.ts';

const typeMap: Record<string, string> = {
	string: 'str',
	number: 'int',
	boolean: 'bool',
};

export function interfaceToPythonDataclass(tsSource: string) {
	const tsEngine = createTsEngine();
	const { root, tree } = parseSource(tsEngine, tsSource);
	const ifaceNode = (root.$children ?? []).find(is.interfaceDeclaration);
	if (!ifaceNode) {
		throw new Error('Expected a top-level TypeScript interface declaration.');
	}
	const iface = wrapNode(ifaceNode, tree) as ReturnType<typeof tsIr.interfaceDeclaration>;

	const fields = iface.body().$children.filter(is.propertySignature).map((member) => {
		const wrappedMember = wrapNode(member, tree) as ReturnType<typeof tsIr.propertySignature>;
		const name = nodeText(wrappedMember.name());
		const rawType = wrappedMember.type()?.type().$render() ?? 'Any';
		const pyType = typeMap[rawType] ?? rawType;
		return `    ${name}: ${pyType}`;
	});

	return [
		'@dataclass',
		`class ${iface.name().$render()}:`,
		...(fields.length > 0 ? fields : ['    pass']),
	].join('\n');
}
