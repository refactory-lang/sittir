import type { Body } from '../../render-body.ts';
import type { EmittedTemplates } from '../../templates.ts';

export function emittedTemplates(bodies: Readonly<Record<string, Body>>): EmittedTemplates {
	return {
		bodies: new Map(Object.entries(bodies)),
		seamCensus: {
			boundaries: [],
			staticGlued: 0,
			staticSpaced: 0,
			runtimeDerivable: 0,
			runtimeVarying: 0,
			preferenceOrigin: 0,
			tokenDefaultOrigin: 0,
			wordDefaultOrigin: 0,
			cascadeOrigin: 0,
			fallbackOrigin: 0
		}
	};
}
