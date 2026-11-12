import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../../grammars.ts';
import { nativeInputs } from '../native-binary-freshness.ts';

describe('the files a native build is fingerprinted by', () => {
	const inputs = Object.keys(nativeInputs(REPO_ROOT, 'regex'));

	it('include the modules the build driver executes from the common runtime', () => {
		expect(inputs).toContain('packages/common/src/native-binding.ts');
	});

	it('leave the common runtime out, so a JS-only edit there keeps every addon fresh', () => {
		const runtime = inputs.filter((file) => file.startsWith('packages/common/src/') && file !== 'packages/common/src/native-binding.ts');
		expect(runtime).toEqual([]);
	});
});
