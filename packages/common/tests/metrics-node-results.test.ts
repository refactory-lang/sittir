import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

describe('withMetrics with metrics on', () => {
	it('passes a built or parsed node through, measuring it without its JSON form', async () => {
		vi.stubEnv('SITTIR_METRICS', '1');
		vi.resetModules();
		const { createEngine, withMetrics } = await import('@sittir/common');
		const rust = (await import('@sittir/rust')).default;
		const rs = await createEngine(rust);
		const built = rs.build.identifier('x');
		expect(withMetrics('rust', 'identifier', () => built)).toBe(built);
		const parsed = withMetrics('rust', 'source_file', () => rs.parse('fn f() {}\n'));
		expect(parsed.$render().toString()).toBe('fn f() {}\n');
		rs.dispose();
	});
});
