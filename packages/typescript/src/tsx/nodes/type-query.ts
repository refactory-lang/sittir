import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression, Identifier, InstantiationExpression, MemberExpression, SubscriptExpression, This, TypeQuery } from '../types.js';


class TypeQueryBuilder extends Builder<TypeQuery> {
  private _children: Builder<CallExpression | Identifier | InstantiationExpression | MemberExpression | SubscriptExpression | This>[] = [];

  constructor(children: Builder<CallExpression | Identifier | InstantiationExpression | MemberExpression | SubscriptExpression | This>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('typeof');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeQuery {
    return {
      kind: 'type_query',
      children: this._children[0]?.build(ctx),
    } as TypeQuery;
  }

  override get nodeKind(): string { return 'type_query'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'typeof', type: 'typeof' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { TypeQueryBuilder };

export function type_query(children: Builder<CallExpression | Identifier | InstantiationExpression | MemberExpression | SubscriptExpression | This>): TypeQueryBuilder {
  return new TypeQueryBuilder(children);
}

export interface TypeQueryOptions {
  children: Builder<CallExpression | Identifier | InstantiationExpression | MemberExpression | SubscriptExpression | This> | (Builder<CallExpression | Identifier | InstantiationExpression | MemberExpression | SubscriptExpression | This>)[];
}

export namespace type_query {
  export function from(options: TypeQueryOptions): TypeQueryBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TypeQueryBuilder(_ctor);
    return b;
  }
}
