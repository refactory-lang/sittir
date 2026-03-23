import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExtendsTypeClause, GenericType, NestedTypeIdentifier, TypeIdentifier } from '../types.js';


class ExtendsTypeClauseBuilder extends Builder<ExtendsTypeClause> {
  private _type: Builder<TypeIdentifier | NestedTypeIdentifier | GenericType>[] = [];

  constructor() { super(); }

  type(...value: Builder<TypeIdentifier | NestedTypeIdentifier | GenericType>[]): this {
    this._type = value;
    return this;
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

  override get nodeKind(): string { return 'extends_type_clause'; }

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

export function extends_type_clause(): ExtendsTypeClauseBuilder {
  return new ExtendsTypeClauseBuilder();
}

export interface ExtendsTypeClauseOptions {
  type?: Builder<TypeIdentifier | NestedTypeIdentifier | GenericType> | string | (Builder<TypeIdentifier | NestedTypeIdentifier | GenericType> | string)[];
}

export namespace extends_type_clause {
  export function from(options: ExtendsTypeClauseOptions): ExtendsTypeClauseBuilder {
    const b = new ExtendsTypeClauseBuilder();
    if (options.type !== undefined) {
      const _v = options.type;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.type(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('type_identifier', _v) : _v));
    }
    return b;
  }
}
