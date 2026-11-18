export interface PortableEmitSlot {
	readonly paths: readonly string[];
	readonly texts: readonly string[];
	readonly unmapped: readonly string[];
	readonly string: boolean;
	readonly numbers: readonly ('bigint' | 'number')[];
	readonly optional: boolean;
}

export interface PortableEmitInput<Table> {
	readonly grammar: string;
	readonly map: string;
	readonly node: string;
	readonly imports: { readonly vocabulary: string; readonly builders: string; readonly map: string; readonly utils: string; readonly nodes: string; readonly types: string };
	readonly table: Table;
	readonly slots: Readonly<Record<string, Readonly<Record<string, PortableEmitSlot>>>>;
	readonly viewed: readonly string[];
	readonly textPaths: readonly string[];
	readonly textInputs: readonly string[];
	readonly textValues: readonly string[];
	readonly holes: readonly (readonly [holder: number, key: string])[];
	readonly decided: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

export type PortableEmitCode = 'portable-emit-unplaced-path' | 'portable-emit-unfit-slot' | 'portable-emit-pinned-gap' | 'portable-emit-type' | 'portable-emit-tail-is-path';

export interface PortableEmitDiagnostic {
	readonly code: PortableEmitCode;
	readonly path: string;
	readonly slot?: string;
	readonly message: string;
}

export interface PortableEmitOutput {
	readonly text: string;
	readonly diagnostics: readonly PortableEmitDiagnostic[];
}
