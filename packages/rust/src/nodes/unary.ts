import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, UnaryExpression } from '../types.js';


class UnaryBuilder extends Builder<UnaryExpression> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('-');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnaryExpression {
    return {
      kind: 'unary_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as UnaryExpression;
  }

  override get nodeKind(): string { return 'unary_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '-', type: '-' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { UnaryBuilder };

export function unary(children: Builder): UnaryBuilder {
  return new UnaryBuilder(children);
}

export interface UnaryExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace unary {
  export function from(options: UnaryExpressionOptions): UnaryBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new UnaryBuilder(_ctor);
    return b;
  }
}
