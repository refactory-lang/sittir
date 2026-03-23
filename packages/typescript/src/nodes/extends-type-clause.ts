import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExtendsTypeClause, GenericType, NestedTypeIdentifier, TypeIdentifier } from '../types.js';


class ExtendsTypeClauseBuilder extends Builder<ExtendsTypeClause> {
  private _type: Builder[] = [];

  constructor(...type_: Builder[]) {
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
      type: this._type.map(c => this.renderChild(c, ctx)),
    } as unknown as ExtendsTypeClause;
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

export function extends_type_clause(...type_: Builder[]): ExtendsTypeClauseBuilder {
  return new ExtendsTypeClauseBuilder(...type_);
}

export interface ExtendsTypeClauseOptions {
  type: Builder<GenericType | NestedTypeIdentifier | TypeIdentifier> | (Builder<GenericType | NestedTypeIdentifier | TypeIdentifier>)[];
}

export namespace extends_type_clause {
  export function from(options: ExtendsTypeClauseOptions): ExtendsTypeClauseBuilder {
    const _ctor = options.type;
    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];
    const b = new ExtendsTypeClauseBuilder(..._arr);
    return b;
  }
}
