export interface PortableEmitMember {
	readonly paths: readonly string[];
	readonly texts: readonly string[];
	readonly string: boolean;
}

export interface PortableEmitInput<Table> {
	readonly grammar: string;
	readonly api: string;
	readonly map: string;
	readonly imports: { readonly vocabulary: string; readonly api: string; readonly map: string };
	readonly table: Table;
	readonly members: Readonly<Record<string, Readonly<Record<string, PortableEmitMember>>>>;
	readonly viewed: readonly string[];
	readonly textPaths: readonly string[];
	readonly holes: readonly (readonly [holder: number, key: string])[];
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
