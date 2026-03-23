import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression, DecoratorParenthesizedExpression, Identifier, MemberExpression } from '../types.js';


class DecoratorParenthesizedExpressionBuilder extends Builder<DecoratorParenthesizedExpression> {
  private _children: Builder<Identifier | MemberExpression | CallExpression>[] = [];

  constructor(...children: Builder<Identifier | MemberExpression | CallExpression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DecoratorParenthesizedExpression {
    return {
      kind: 'decorator_parenthesized_expression',
      children: this._children.map(c => c.build(ctx)),
    } as DecoratorParenthesizedExpression;
  }

  override get nodeKind(): string { return 'decorator_parenthesized_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { DecoratorParenthesizedExpressionBuilder };

export function decorator_parenthesized_expression(...children: Builder<Identifier | MemberExpression | CallExpression>[]): DecoratorParenthesizedExpressionBuilder {
  return new DecoratorParenthesizedExpressionBuilder(...children);
}

export interface DecoratorParenthesizedExpressionOptions {
  children?: Builder<Identifier | MemberExpression | CallExpression> | string | (Builder<Identifier | MemberExpression | CallExpression> | string)[];
}

export namespace decorator_parenthesized_expression {
  export function from(options: DecoratorParenthesizedExpressionOptions): DecoratorParenthesizedExpressionBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new DecoratorParenthesizedExpressionBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v));
    return b;
  }
}
