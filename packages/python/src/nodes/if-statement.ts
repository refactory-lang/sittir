import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElifClause, ElseClause, Expression, IfStatement } from '../types.js';


class IfStatementBuilder extends Builder<IfStatement> {
  private _alternative: Builder<ElifClause | ElseClause>[] = [];
  private _condition: Builder<Expression>;
  private _consequence!: Builder<Block>;

  constructor(condition: Builder<Expression>) {
    super();
    this._condition = condition;
  }

  alternative(...value: Builder<ElifClause | ElseClause>[]): this {
    this._alternative = value;
    return this;
  }

  consequence(value: Builder<Block>): this {
    this._consequence = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('if');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    parts.push(':');
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    if (this._alternative.length > 0) parts.push(this.renderChildren(this._alternative, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IfStatement {
    return {
      kind: 'if_statement',
      alternative: this._alternative.map(c => c.build(ctx)),
      condition: this._condition.build(ctx),
      consequence: this._consequence?.build(ctx),
    } as IfStatement;
  }

  override get nodeKind(): string { return 'if_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'if', type: 'if' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    for (const child of this._alternative) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'alternative' });
    }
    return parts;
  }
}

export type { IfStatementBuilder };

export function if_statement(condition: Builder<Expression>): IfStatementBuilder {
  return new IfStatementBuilder(condition);
}

export interface IfStatementOptions {
  alternative?: Builder<ElifClause | ElseClause> | (Builder<ElifClause | ElseClause>)[];
  condition: Builder<Expression>;
  consequence: Builder<Block>;
}

export namespace if_statement {
  export function from(options: IfStatementOptions): IfStatementBuilder {
    const b = new IfStatementBuilder(options.condition);
    if (options.alternative !== undefined) {
      const _v = options.alternative;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.alternative(..._arr);
    }
    if (options.consequence !== undefined) b.consequence(options.consequence);
    return b;
  }
}
