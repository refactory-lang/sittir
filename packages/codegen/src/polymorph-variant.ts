export type PolymorphVariantDescriptor =
	| {
			readonly definedBy: 'override';
			readonly childKind: Readonly<Record<string, string>>;
			readonly helperKind?: Readonly<Record<string, string>>;
			readonly helperChildKind?: Readonly<Record<string, readonly string[]>>;
	  }
	| {
			readonly definedBy: 'promoted';
			readonly slots: Readonly<Record<string, readonly string[]>>;
	  };

export type PolymorphVariantMap = Readonly<Record<string, PolymorphVariantDescriptor>>;

export function assertNever(x: never): never {
	throw new Error(`assertNever: unexpected variant ${JSON.stringify(x)}`);
}
