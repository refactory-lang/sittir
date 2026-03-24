import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DynamicType, FunctionType, GenericType, HigherRankedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier } from '../types.js';
import { higher_ranked_trait_bound } from './higher-ranked-trait-bound.js';
import type { HigherRankedTraitBoundOptions } from './higher-ranked-trait-bound.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';
import { function_type } from './function-type.js';
import type { FunctionTypeOptions } from './function-type.js';
import { tuple_type } from './tuple-type.js';
import type { TupleTypeOptions } from './tuple-type.js';


class DynamicTypeBuilder extends Builder<DynamicType> {
  private _trait: Builder<TypeIdentifier | HigherRankedTraitBound | ScopedTypeIdentifier | GenericType | FunctionType | TupleType>;

  constructor(trait: Builder<TypeIdentifier | HigherRankedTraitBound | ScopedTypeIdentifier | GenericType | FunctionType | TupleType>) {
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

  override get nodeKind(): 'dynamic_type' { return 'dynamic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'dyn', type: 'dyn' });
    if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
    return parts;
  }
}

export type { DynamicTypeBuilder };

export function dynamic_type(trait: Builder<TypeIdentifier | HigherRankedTraitBound | ScopedTypeIdentifier | GenericType | FunctionType | TupleType>): DynamicTypeBuilder {
  return new DynamicTypeBuilder(trait);
}

export interface DynamicTypeOptions {
  nodeKind: 'dynamic_type';
  trait: Builder<TypeIdentifier | HigherRankedTraitBound | ScopedTypeIdentifier | GenericType | FunctionType | TupleType> | HigherRankedTraitBoundOptions | ScopedTypeIdentifierOptions | GenericTypeOptions | FunctionTypeOptions | TupleTypeOptions;
}

export namespace dynamic_type {
  export function from(input: Omit<DynamicTypeOptions, 'nodeKind'> | Builder<TypeIdentifier | HigherRankedTraitBound | ScopedTypeIdentifier | GenericType | FunctionType | TupleType> | HigherRankedTraitBoundOptions | ScopedTypeIdentifierOptions | GenericTypeOptions | FunctionTypeOptions | TupleTypeOptions): DynamicTypeBuilder {
    const options: Omit<DynamicTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'trait' in input
      ? input as Omit<DynamicTypeOptions, 'nodeKind'>
      : { trait: input } as Omit<DynamicTypeOptions, 'nodeKind'>;
    const _raw = options.trait;
    let _ctor: Builder<TypeIdentifier | HigherRankedTraitBound | ScopedTypeIdentifier | GenericType | FunctionType | TupleType>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'higher_ranked_trait_bound': _ctor = higher_ranked_trait_bound.from(_raw); break;
        case 'scoped_type_identifier': _ctor = scoped_type_identifier.from(_raw); break;
        case 'generic_type': _ctor = generic_type.from(_raw); break;
        case 'function_type': _ctor = function_type.from(_raw); break;
        case 'tuple_type': _ctor = tuple_type.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new DynamicTypeBuilder(_ctor);
    return b;
  }
}
