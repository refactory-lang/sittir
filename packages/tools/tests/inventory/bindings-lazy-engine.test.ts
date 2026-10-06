import { expect, it, vi } from 'vitest';

vi.mock('@sittir/common', async (importOriginal) => {
	const common = await importOriginal<typeof import('@sittir/common')>();
	return { ...common, createEngine: vi.fn(common.createEngine) };
});

it('loading the bindings module creates no engine, and the first read creates exactly one', async () => {
	const { createEngine } = await import('@sittir/common');
	const bindings = await import('../../src/inventory/bindings.ts');
	expect(createEngine).not.toHaveBeenCalled();
	await bindings.readBindings('(identifier) @identifier');
	await bindings.readBindings('(identifier) @identifier');
	expect(createEngine).toHaveBeenCalledTimes(1);
});
