import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause, Expression, ExpressionList, ForStatement, Pattern, PatternList } from '../types.js';
import { pattern_list } from './pattern-list.js';
import type { PatternListOptions } from './pattern-list.js';
import { expression_list } from './expression-list.js';
import type { ExpressionListOptions } from './expression-list.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { else_clause } from './else-clause.js';
import type { ElseClauseOptions } from './else-clause.js';


class ForStatementBuilder extends Builder<ForStatement> {
  private _left: Builder<Pattern | PatternList>;
  private _right!: Builder<Expression | ExpressionList>;
  private _body!: Builder<Block>;
  private _alternative?: Builder<ElseClause>;

  constructor(left: Builder<Pattern | PatternList>) {
    super();
    this._left = left;
  }

  right(value: Builder<Expression | ExpressionList>): this {
    this._right = value;
    return this;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  alternative(value: Builder<ElseClause>): this {
    this._alternative = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('in');
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForStatement {
    return {
      kind: 'for_statement',
      left: this._left.build(ctx),
      right: this._right ? this._right.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
      alternative: this._alternative ? this._alternative.build(ctx) : undefined,
    } as ForStatement;
  }

  override get nodeKind(): 'for_statement' { return 'for_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: 'in', type: 'in' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    return parts;
  }
}

export type { ForStatementBuilder };

export function for_statement(left: Builder<Pattern | PatternList>): ForStatementBuilder {
  return new ForStatementBuilder(left);
}

export interface ForStatementOptions {
  nodeKind: 'for_statement';
  left: Builder<Pattern | PatternList> | Omit<PatternListOptions, 'nodeKind'>;
  right: Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'>;
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
  alternative?: Builder<ElseClause> | Omit<ElseClauseOptions, 'nodeKind'>;
}

export namespace for_statement {
  export function from(options: Omit<ForStatementOptions, 'nodeKind'>): ForStatementBuilder {
    const _ctor = options.left;
    const b = new ForStatementBuilder(_ctor instanceof Builder ? _ctor : pattern_list.from(_ctor));
    if (options.right !== undefined) {
      const _v = options.right;
      b.right(_v instanceof Builder ? _v : expression_list.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : block.from(_v));
    }
    if (options.alternative !== undefined) {
      const _v = options.alternative;
      b.alternative(_v instanceof Builder ? _v : else_clause.from(_v));
    }
    return b;
  }
}
