import type { PortableBuildTable } from '../../../../../../types/src/portable-build.ts';

export interface PortableEmitMember {
	readonly paths: readonly string[];
	readonly texts: readonly string[];
	readonly string: boolean;
}

export interface PortableEmitInput {
	readonly grammar: string;
	readonly api: string;
	readonly map: string;
	readonly table: PortableBuildTable;
	readonly members: Readonly<Record<string, Readonly<Record<string, PortableEmitMember>>>>;
}

export type PortableEmitCode = 'portable-emit-unplaced-path' | 'portable-emit-unfit-member' | 'portable-emit-pinned-gap' | 'portable-emit-type' | 'portable-emit-tail-is-path';

export interface PortableEmitDiagnostic {
	readonly code: PortableEmitCode;
	readonly path: string;
	readonly member?: string;
	readonly message: string;
}

export interface PortableEmitOutput {
	readonly text: string;
	readonly diagnostics: readonly PortableEmitDiagnostic[];
}
