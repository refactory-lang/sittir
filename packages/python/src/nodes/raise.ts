import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionList, RaiseStatement } from '../types.js';


class RaiseBuilder extends Builder<RaiseStatement> {
  private _cause?: Builder<Expression>;
  private _children: Builder<Expression | ExpressionList>[] = [];

  constructor() { super(); }

  cause(value: Builder<Expression>): this {
    this._cause = value;
    return this;
  }

  children(...value: Builder<Expression | ExpressionList>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('raise');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._cause) {
      parts.push('from');
      if (this._cause) parts.push(this.renderChild(this._cause, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RaiseStatement {
    return {
      kind: 'raise_statement',
      cause: this._cause?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as RaiseStatement;
  }

  override get nodeKind(): string { return 'raise_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'raise', type: 'raise' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._cause) {
      parts.push({ kind: 'token', text: 'from', type: 'from' });
      if (this._cause) parts.push({ kind: 'builder', builder: this._cause, fieldName: 'cause' });
    }
    return parts;
  }
}

export type { RaiseBuilder };

export function raise(): RaiseBuilder {
  return new RaiseBuilder();
}

export interface RaiseStatementOptions {
  cause?: Builder<Expression>;
  children?: Builder<Expression | ExpressionList> | (Builder<Expression | ExpressionList>)[];
}

export namespace raise {
  export function from(options: RaiseStatementOptions): RaiseBuilder {
    const b = new RaiseBuilder();
    if (options.cause !== undefined) b.cause(options.cause);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
