import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExtendsTypeClause, GenericType, NestedTypeIdentifier, TypeIdentifier } from '../types.js';
import { nested_type_identifier } from './nested-type-identifier.js';
import type { NestedTypeIdentifierOptions } from './nested-type-identifier.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';


class ExtendsTypeClauseBuilder extends Builder<ExtendsTypeClause> {
  private _type: Builder<TypeIdentifier | NestedTypeIdentifier | GenericType>[] = [];

  constructor(...type_: Builder<TypeIdentifier | NestedTypeIdentifier | GenericType>[]) {
    super();
    this._type = type_;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('extends');
    if (this._type.length > 0) parts.push(this.renderChildren(this._type, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExtendsTypeClause {
    return {
      kind: 'extends_type_clause',
      type: this._type.map(c => c.build(ctx)),
    } as ExtendsTypeClause;
  }

  override get nodeKind(): 'extends_type_clause' { return 'extends_type_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'extends', type: 'extends' });
    for (const child of this._type) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'type' });
    }
    return parts;
  }
}

export type { ExtendsTypeClauseBuilder };

export function extends_type_clause(...type_: Builder<TypeIdentifier | NestedTypeIdentifier | GenericType>[]): ExtendsTypeClauseBuilder {
  return new ExtendsTypeClauseBuilder(...type_);
}

export interface ExtendsTypeClauseOptions {
  nodeKind: 'extends_type_clause';
  type: Builder<TypeIdentifier | NestedTypeIdentifier | GenericType> | string | NestedTypeIdentifierOptions | GenericTypeOptions | (Builder<TypeIdentifier | NestedTypeIdentifier | GenericType> | string | NestedTypeIdentifierOptions | GenericTypeOptions)[];
}

export namespace extends_type_clause {
  export function from(input: Omit<ExtendsTypeClauseOptions, 'nodeKind'> | Builder<TypeIdentifier | NestedTypeIdentifier | GenericType> | string | NestedTypeIdentifierOptions | GenericTypeOptions | (Builder<TypeIdentifier | NestedTypeIdentifier | GenericType> | string | NestedTypeIdentifierOptions | GenericTypeOptions)[]): ExtendsTypeClauseBuilder {
    const options: Omit<ExtendsTypeClauseOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'type' in input
      ? input as Omit<ExtendsTypeClauseOptions, 'nodeKind'>
      : { type: input } as Omit<ExtendsTypeClauseOptions, 'nodeKind'>;
    const _ctor = options.type;
    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];
    const b = new ExtendsTypeClauseBuilder(..._arr.map(_v => { if (typeof _v === 'string') return new LeafBuilder('type_identifier', _v); if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'nested_type_identifier': return nested_type_identifier.from(_v);   case 'generic_type': return generic_type.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
