import { afterAll, expect, it, vi } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../../../codegen/src/__tests__/helpers/timeouts.ts';
import type { NodeStorage } from '@sittir/types';
import { disposeNativeEngines, loadNativeEngine, useValidationNodeStorage } from '../../../src/validate/common.ts';
import { validateReadRenderParse } from '../../../src/validate/read-render-parse.ts';
import { RoundtripProfile } from '../../../src/validate/roundtrip-profile.ts';

export function deepRendersThroughTemplates(storage: NodeStorage): void {
	useValidationNodeStorage(storage);
	afterAll(disposeNativeEngines);

	it(
		`renders each deep candidate from its templates, copying none (${storage} storage)`,
		async () => {
			const engine = await loadNativeEngine('scm');
			const templates = vi.spyOn(engine.diagnostics, 'renderTemplates');
			const profile = new RoundtripProfile();
			await validateReadRenderParse('scm', { backend: 'native', recursive: true, profile });
			const { phases, work } = profile.finish();
			expect(work.cases).toBeGreaterThan(0);
			expect(phases.copy.calls).toBe(0);
			expect(templates).toHaveBeenCalledTimes(work.cases);
		},
		FULL_PIPELINE_TIMEOUT
	);
}
