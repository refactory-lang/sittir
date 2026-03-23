import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionStatement } from '../types.js';


class ExpressionBuilder extends Builder<ExpressionStatement> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExpressionStatement {
    return {
      kind: 'expression_statement',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ExpressionStatement;
  }

  override get nodeKind(): string { return 'expression_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { ExpressionBuilder };

export function expression(children: Builder): ExpressionBuilder {
  return new ExpressionBuilder(children);
}

export interface ExpressionStatementOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace expression {
  export function from(options: ExpressionStatementOptions): ExpressionBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ExpressionBuilder(_ctor);
    return b;
  }
}
