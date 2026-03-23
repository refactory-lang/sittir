import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertStatement, Expression } from '../types.js';


class AssertStatementBuilder extends Builder<AssertStatement> {
  private _children: Builder<Expression>[] = [];

  constructor(...children: Builder<Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('assert');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AssertStatement {
    return {
      kind: 'assert_statement',
      children: this._children.map(c => c.build(ctx)),
    } as AssertStatement;
  }

  override get nodeKind(): string { return 'assert_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'assert', type: 'assert' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { AssertStatementBuilder };

export function assert_statement(...children: Builder<Expression>[]): AssertStatementBuilder {
  return new AssertStatementBuilder(...children);
}

export interface AssertStatementOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace assert_statement {
  export function from(options: AssertStatementOptions): AssertStatementBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new AssertStatementBuilder(..._arr);
    return b;
  }
}
