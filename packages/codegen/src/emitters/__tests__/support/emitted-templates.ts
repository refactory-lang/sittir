import { printJinja, type Body } from '../../render-body.ts';
import type { EmittedTemplates } from '../../templates.ts';

export function emittedTemplates(bodies: Readonly<Record<string, Body>>): EmittedTemplates {
	const map = new Map(Object.entries(bodies));
	return {
		bodies: map,
		jinja: new Map([...map].map(([kind, body]) => [kind, `{# @generated #}\n${printJinja(body)}`])),
		seamCensus: { boundaries: [], staticGlued: 0, staticSpaced: 0, runtimeDerivable: 0, runtimeVarying: 0 }
	};
}
