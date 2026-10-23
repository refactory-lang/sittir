import { polymorphVisibleName } from '../arm-names.ts';

export interface VariantPlaceholder {
	readonly __sittirPlaceholder: 'variant';
	readonly name: string;
	readonly nestedUnder?: readonly string[];
	readonly absent?: true;
	readonly default?: true;
}

export interface VariantOptions {
	readonly absent?: true;
	readonly default?: true;
}

export const ABSENT_VARIANT_NAME = 'bare';

export function isVariantPlaceholder(v: unknown): v is VariantPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'variant';
}

export const DIRECT_VARIANT_KEY: unique symbol = Symbol.for('sittir.directVariant');

export function variant(name: string, options?: VariantOptions): VariantPlaceholder;
export function variant<R extends object>(name: string, rule: R, options?: VariantOptions): R;
export function variant(name: string, ruleOrOptions?: object, options?: VariantOptions): object {
	if (!isRuleShape(ruleOrOptions)) return variantPlaceholder(name, ruleOrOptions as VariantOptions | undefined);
	return Object.defineProperty({ ...ruleOrOptions }, DIRECT_VARIANT_KEY, { value: variantPlaceholder(name, options), enumerable: false });
}

function variantPlaceholder(name: string, options: VariantOptions | undefined): VariantPlaceholder {
	return { __sittirPlaceholder: 'variant' as const, name, ...(options?.absent === true ? { absent: true as const } : {}), ...(options?.default === true ? { default: true as const } : {}) };
}

function isRuleShape(value: unknown): value is object {
	return !!value && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string';
}

export function directVariantOf(rule: unknown): VariantPlaceholder | undefined {
	return isRuleShape(rule) ? (Reflect.get(rule, DIRECT_VARIANT_KEY) as VariantPlaceholder | undefined) : undefined;
}

export function variantMintName(v: VariantPlaceholder): string {
	return [...(v.nestedUnder ?? []), v.name].join('_');
}

export function variantOwnerKind(parentKind: string, v: VariantPlaceholder): string {
	return v.nestedUnder === undefined || v.nestedUnder.length === 0 ? parentKind : polymorphVisibleName(parentKind, v.nestedUnder.join('_'));
}

export function nestVariant(v: VariantPlaceholder, nestedUnder: readonly string[]): VariantPlaceholder {
	return nestedUnder.length === 0 ? v : { ...v, nestedUnder };
}
