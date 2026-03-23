import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ParenthesizedExpression } from '../types.js';


class ParenthesizedBuilder extends Builder<ParenthesizedExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ParenthesizedExpression {
    return {
      kind: 'parenthesized_expression',
      children: this._children[0]?.build(ctx),
    } as ParenthesizedExpression;
  }

  override get nodeKind(): string { return 'parenthesized_expression'; }

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

export type { ParenthesizedBuilder };

export function parenthesized(children: Builder<Expression>): ParenthesizedBuilder {
  return new ParenthesizedBuilder(children);
}

export interface ParenthesizedExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace parenthesized {
  export function from(options: ParenthesizedExpressionOptions): ParenthesizedBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ParenthesizedBuilder(_ctor);
    return b;
  }
}
