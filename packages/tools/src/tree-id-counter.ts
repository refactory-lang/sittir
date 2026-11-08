import type { Language, LanguageAPI } from '@sittir/types';

export interface CounterSample {
	readonly language: Language<LanguageAPI>;
	readonly source: string;
}

export interface TreeIdCounterReport {
	readonly outOfOrder: readonly number[];
	readonly onGlobalThis?: unknown;
}

export async function treeIdCounter(samples: readonly CounterSample[], parses = 50): Promise<TreeIdCounterReport> {
	const parsers = await Promise.all(
		samples.map(async ({ language, source }) => {
			const native = (await language.load()).createNative();
			return () => Math.floor(native.parseAndRead(source).root.$_layout!.at!.$treeHandle / 2 ** 32);
		})
	);
	const ids = Array.from({ length: parses }, (_, parse) => parsers[parse % parsers.length]!());
	const onGlobalThis = (globalThis as { __sittirNextTreeId?: unknown }).__sittirNextTreeId;
	return { outOfOrder: ids.filter((id, parse) => parse > 0 && id <= ids[parse - 1]!), ...(onGlobalThis === undefined ? {} : { onGlobalThis }) };
}
