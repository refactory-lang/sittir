import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DynamicType, FunctionType, GenericType, HigherRankedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier } from '../types.js';


class DynamicTypeBuilder extends Builder<DynamicType> {
  private _trait: Builder<FunctionType | GenericType | HigherRankedTraitBound | ScopedTypeIdentifier | TupleType | TypeIdentifier>;

  constructor(trait: Builder<FunctionType | GenericType | HigherRankedTraitBound | ScopedTypeIdentifier | TupleType | TypeIdentifier>) {
    super();
    this._trait = trait;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('dyn');
    if (this._trait) parts.push(this.renderChild(this._trait, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DynamicType {
    return {
      kind: 'dynamic_type',
      trait: this._trait.build(ctx),
    } as DynamicType;
  }

  override get nodeKind(): string { return 'dynamic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'dyn', type: 'dyn' });
    if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
    return parts;
  }
}

export type { DynamicTypeBuilder };

export function dynamic_type(trait: Builder<FunctionType | GenericType | HigherRankedTraitBound | ScopedTypeIdentifier | TupleType | TypeIdentifier>): DynamicTypeBuilder {
  return new DynamicTypeBuilder(trait);
}

export interface DynamicTypeOptions {
  trait: Builder<FunctionType | GenericType | HigherRankedTraitBound | ScopedTypeIdentifier | TupleType | TypeIdentifier>;
}

export namespace dynamic_type {
  export function from(options: DynamicTypeOptions): DynamicTypeBuilder {
    const b = new DynamicTypeBuilder(options.trait);
    return b;
  }
}
