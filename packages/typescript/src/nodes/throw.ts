import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SequenceExpression, ThrowStatement } from '../types.js';


class ThrowBuilder extends Builder<ThrowStatement> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('throw');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ThrowStatement {
    return {
      kind: 'throw_statement',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ThrowStatement;
  }

  override get nodeKind(): string { return 'throw_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'throw', type: 'throw' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ThrowBuilder };

export function throw_(children: Builder): ThrowBuilder {
  return new ThrowBuilder(children);
}

export interface ThrowStatementOptions {
  children: Builder<Expression | SequenceExpression> | (Builder<Expression | SequenceExpression>)[];
}

export namespace throw_ {
  export function from(options: ThrowStatementOptions): ThrowBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ThrowBuilder(_ctor);
    return b;
  }
}
