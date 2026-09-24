export type SubKindOf<T extends { kind: string }> = Omit<T,'kind'> & {kind: `${T['kind']}.${string}`}
