import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression, Identifier, InstantiationExpression, MemberExpression, SubscriptExpression, This, TypeQuery } from '../types.js';
import { subscript_expression } from './subscript-expression.js';
import type { SubscriptExpressionOptions } from './subscript-expression.js';
import { member_expression } from './member-expression.js';
import type { MemberExpressionOptions } from './member-expression.js';
import { call_expression } from './call-expression.js';
import type { CallExpressionOptions } from './call-expression.js';
import { instantiation_expression } from './instantiation-expression.js';
import type { InstantiationExpressionOptions } from './instantiation-expression.js';


class TypeQueryBuilder extends Builder<TypeQuery> {
  private _children: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This>[] = [];

  constructor(children: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This>) {
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
      children: this._children[0]!.build(ctx),
    } as TypeQuery;
  }

  override get nodeKind(): 'type_query' { return 'type_query'; }

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

export function type_query(children: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This>): TypeQueryBuilder {
  return new TypeQueryBuilder(children);
}

export interface TypeQueryOptions {
  nodeKind: 'type_query';
  children: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This> | SubscriptExpressionOptions | MemberExpressionOptions | CallExpressionOptions | InstantiationExpressionOptions | (Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This> | SubscriptExpressionOptions | MemberExpressionOptions | CallExpressionOptions | InstantiationExpressionOptions)[];
}

export namespace type_query {
  export function from(input: Omit<TypeQueryOptions, 'nodeKind'> | Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This> | SubscriptExpressionOptions | MemberExpressionOptions | CallExpressionOptions | InstantiationExpressionOptions | (Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This> | SubscriptExpressionOptions | MemberExpressionOptions | CallExpressionOptions | InstantiationExpressionOptions)[]): TypeQueryBuilder {
    const options: Omit<TypeQueryOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TypeQueryOptions, 'nodeKind'>
      : { children: input } as Omit<TypeQueryOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'subscript_expression': _resolved = subscript_expression.from(_ctor); break;
        case 'member_expression': _resolved = member_expression.from(_ctor); break;
        case 'call_expression': _resolved = call_expression.from(_ctor); break;
        case 'instantiation_expression': _resolved = instantiation_expression.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new TypeQueryBuilder(_resolved);
    return b;
  }
}
