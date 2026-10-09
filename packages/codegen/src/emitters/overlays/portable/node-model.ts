import type { PortableCondition } from '@sittir/types';
import type { GrammarRoutes, MemberRoute, ReadEntry } from '../../../bindings/routes.ts';
import { namespaceSection } from './namespaces.ts';

const readEntryRecord = (entry: ReadEntry, test: readonly PortableCondition[]) => ({
	vocab: entry.vocab,
	toplevel: entry.claim.toplevel,
	within: entry.claim.within,
	pins: entry.pins,
	test,
	...(entry.template === undefined
		? {}
		: { template: { target: entry.template.target, template: entry.template.template, holes: entry.template.holes } })
});

function memberRecord(route: MemberRoute) {
	switch (route.route) {
		case 'slot':
			return { name: route.name, route: route.route, slot: route.slot.name, path: route.path };
		case 'presence':
			return { name: route.name, route: route.route, via: route.via, token: route.token, path: route.path ?? null };
		case 'nested':
			return {
				name: route.name,
				route: route.route,
				via: route.via,
				parent: route.parent,
				slot: route.slot?.name ?? null,
				multiple: route.multiple,
				path: route.path ?? null
			};
	}
}

export function emitPortableNodeModel(routes: GrammarRoutes, readTest: (entry: ReadEntry) => readonly PortableCondition[]): string {
	const kinds = [...new Set([...routes.readEntries.keys(), ...routes.containers.keys()])].sort();
	const record = {
		grammar: routes.grammar,
		kinds: Object.fromEntries(
			kinds.map((kind) => {
				const vocab = routes.vocabOf.get(kind);
				const read = routes.readEntries.get(kind);
				const members = routes.members.get(kind);
				const container = routes.containers.get(kind);
				return [
					kind,
					{
						...(vocab === undefined ? {} : { vocab }),
						...(read === undefined ? {} : { read: read.map((entry) => readEntryRecord(entry, readTest(entry))) }),
						...(members === undefined ? {} : { members: members.map(memberRecord) }),
						...(container === undefined ? {} : { container })
					}
				];
			})
		),
		namespaces: namespaceSection(routes.readEntries)
	};
	return `${JSON.stringify(record, null, 2)}\n`;
}
