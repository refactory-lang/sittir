import type { PortableCondition } from '@sittir/types';
import type { GrammarRoutes, SlotRoute, ReadEntry } from '../../../bindings/routes.ts';
import { namespaceSection } from './namespaces.ts';
import type { FamilyCoverage } from './covered.ts';

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

function slotRecord(route: SlotRoute) {
	return { ...routeRecord(route), ...(route.flag === true ? { flag: true } : {}), ...(route.spelled === true ? { spelled: true } : {}) };
}

function routeRecord(route: SlotRoute) {
	switch (route.route) {
		case 'slot':
			return { name: route.name, route: route.route, slot: route.slot.name, ...(route.except === undefined ? {} : { except: route.except }), path: route.path };
		case 'kind':
			return { name: route.name, route: route.route, kind: route.kind, path: route.path ?? null };
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
		case 'delimiter':
			return { name: route.name, route: route.route, delimiter: route.delimiter, ...(route.items === undefined ? {} : { items: route.items }), path: route.path ?? null };
	}
}

const coverageRecord = ({ entry, cases, refinements, overlapping }: FamilyCoverage) => ({
	path: entry.vocab,
	cases,
	refinements,
	...(overlapping.length === 0 ? {} : { overlapping })
});

export function emitPortableNodeModel(routes: GrammarRoutes, readTest: (entry: ReadEntry) => readonly PortableCondition[], coverage: readonly FamilyCoverage[]): string {
	const kinds = [...new Set([...routes.readEntries.keys(), ...routes.containers.keys()])].sort();
	const record = {
		grammar: routes.grammar,
		kinds: Object.fromEntries(
			kinds.map((kind) => {
				const vocab = routes.vocabOf.get(kind);
				const read = routes.readEntries.get(kind);
				const slots = routes.slots.get(kind);
				const container = routes.containers.get(kind);
				const covered = coverage.filter(({ entry }) => entry.kind === kind);
				return [
					kind,
					{
						...(vocab === undefined ? {} : { vocab }),
						...(read === undefined ? {} : { read: read.map((entry) => readEntryRecord(entry, readTest(entry))) }),
						...(covered.length === 0 ? {} : { covered: covered.map(coverageRecord) }),
						...(slots === undefined ? {} : { slots: slots.map(slotRecord) }),
						...(container === undefined ? {} : { container })
					}
				];
			})
		),
		namespaces: namespaceSection(routes.readEntries)
	};
	return `${JSON.stringify(record, null, 2)}\n`;
}
