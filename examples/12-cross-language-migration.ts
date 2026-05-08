import { createEngine as createTsEngine, wrap as wrapTs, is } from '@sittir/typescript';
import { snippets as pySnippets } from '@sittir/python';

const typeMap: Record<string, string> = {
	string: 'str',
	number: 'int',
	boolean: 'bool'
};

export function interfaceToPythonDataclass(tsSource: string) {
	const tsEngine = createTsEngine();
	const tree = tsEngine.parseAndRead(tsSource);
	const iface = wrapTs(tree.$children[0], tree);

	const fields = iface
		.body()
		.$children.filter((member) => is.propertySignature(member))
		.map((member) => {
			const wrappedMember = wrapTs(member, tree);
			const name = wrappedMember.name();
			const pyType = typeMap[wrappedMember.type()] || wrappedMember.type();
			return `${name}: ${pyType}`;
		});

	return pySnippets.dataclass
		.from({
			NAME: iface.name(),
			FIELDS: fields
		})
		.render();
}
