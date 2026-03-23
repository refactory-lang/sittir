import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElifClause, Expression } from '../types.js';


class ElifClauseBuilder extends Builder<ElifClause> {
  private _condition: Builder<Expression>;
  private _consequence!: Builder<Block>;

  constructor(condition: Builder<Expression>) {
    super();
    this._condition = condition;
  }

  consequence(value: Builder<Block>): this {
    this._consequence = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('elif');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    parts.push(':');
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ElifClause {
    return {
      kind: 'elif_clause',
      condition: this._condition.build(ctx),
      consequence: this._consequence?.build(ctx),
    } as ElifClause;
  }

  override get nodeKind(): string { return 'elif_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'elif', type: 'elif' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    return parts;
  }
}

export type { ElifClauseBuilder };

export function elif_clause(condition: Builder<Expression>): ElifClauseBuilder {
  return new ElifClauseBuilder(condition);
}

export interface ElifClauseOptions {
  condition: Builder<Expression>;
  consequence: Builder<Block>;
}

export namespace elif_clause {
  export function from(options: ElifClauseOptions): ElifClauseBuilder {
    const b = new ElifClauseBuilder(options.condition);
    if (options.consequence !== undefined) b.consequence(options.consequence);
    return b;
  }
}
