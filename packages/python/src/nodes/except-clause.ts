import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ExceptClause, Expression } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class ExceptClauseBuilder extends Builder<ExceptClause> {
  private _value: Builder<Expression>[] = [];
  private _alias?: Builder<Expression>;
  private _children: Builder<Block>[] = [];

  constructor(children: Builder<Block>) {
    super();
    this._children = [children];
  }

  value(...value: Builder<Expression>[]): this {
    this._value = value;
    return this;
  }

  alias(value: Builder<Expression>): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('except');
    if (this._value.length > 0) parts.push(this.renderChildren(this._value, ', ', ctx));
    if (this._alias) {
      parts.push('as');
      if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    }
    parts.push(':');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExceptClause {
    return {
      kind: 'except_clause',
      value: this._value.map(c => c.build(ctx)),
      alias: this._alias ? this._alias.build(ctx) : undefined,
      children: this._children[0]!.build(ctx),
    } as ExceptClause;
  }

  override get nodeKind(): 'except_clause' { return 'except_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'except', type: 'except' });
    for (const child of this._value) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'value' });
    }
    if (this._alias) {
      parts.push({ kind: 'token', text: 'as', type: 'as' });
      if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    }
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ExceptClauseBuilder };

export function except_clause(children: Builder<Block>): ExceptClauseBuilder {
  return new ExceptClauseBuilder(children);
}

export interface ExceptClauseOptions {
  nodeKind: 'except_clause';
  value?: Builder<Expression> | (Builder<Expression>)[];
  alias?: Builder<Expression>;
  children: Builder<Block> | Omit<BlockOptions, 'nodeKind'> | (Builder<Block> | Omit<BlockOptions, 'nodeKind'>)[];
}

export namespace except_clause {
  export function from(options: Omit<ExceptClauseOptions, 'nodeKind'>): ExceptClauseBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ExceptClauseBuilder(_ctor instanceof Builder ? _ctor : block.from(_ctor));
    if (options.value !== undefined) {
      const _v = options.value;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.value(..._arr);
    }
    if (options.alias !== undefined) b.alias(options.alias);
    return b;
  }
}
