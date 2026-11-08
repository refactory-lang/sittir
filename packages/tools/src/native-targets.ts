import { NATIVE_TARGETS, type NativeTarget } from '@sittir/codegen/grammars';

export interface NativeTargetHosts {
	readonly build: string;
	readonly run: string;
	readonly container?: string;
}

const ALPINE = 'node:22-alpine';

export const NATIVE_TARGET_HOSTS: Readonly<Record<NativeTarget, NativeTargetHosts>> = {
	'aarch64-apple-darwin': { build: 'macos-15', run: 'macos-15' },
	'x86_64-unknown-linux-gnu': { build: 'ubuntu-22.04', run: 'ubuntu-22.04' },
	'x86_64-unknown-linux-musl': { build: 'ubuntu-22.04', run: 'ubuntu-24.04', container: ALPINE },
	'aarch64-unknown-linux-gnu': { build: 'ubuntu-22.04', run: 'ubuntu-24.04-arm' },
	'aarch64-unknown-linux-musl': { build: 'ubuntu-22.04', run: 'ubuntu-24.04-arm', container: ALPINE },
	'x86_64-pc-windows-msvc': { build: 'windows-2022', run: 'windows-2022' }
};

export interface NativeTargetRow {
	readonly target: NativeTarget;
	readonly host: string;
	readonly cross: boolean;
	readonly runner: string;
	readonly container?: string;
}

export function nativeTargetRows(targets: readonly string[] = NATIVE_TARGETS): NativeTargetRow[] {
	const unknown = targets.filter((target) => !(NATIVE_TARGETS as readonly string[]).includes(target));
	if (unknown.length > 0) throw new Error(`${unknown.join(', ')} is not one of NATIVE_TARGETS`);
	return NATIVE_TARGETS.filter((target) => targets.includes(target)).map((target) => {
		const { build, run, container } = NATIVE_TARGET_HOSTS[target];
		return { target, host: build, cross: build !== run || container !== undefined, runner: run, ...(container === undefined ? {} : { container }) };
	});
}
