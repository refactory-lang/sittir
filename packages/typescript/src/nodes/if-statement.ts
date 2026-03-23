import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ElseClause, IfStatement, ParenthesizedExpression, Statement } from '../types.js';


class IfStatementBuilder extends Builder<IfStatement> {
  private _alternative?: Builder<ElseClause>;
  private _condition: Builder<ParenthesizedExpression>;
  private _consequence!: Builder<Statement>;

  constructor(condition: Builder<ParenthesizedExpression>) {
    super();
    this._condition = condition;
  }

  alternative(value: Builder<ElseClause>): this {
    this._alternative = value;
    return this;
  }

  consequence(value: Builder<Statement>): this {
    this._consequence = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('if');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IfStatement {
    return {
      kind: 'if_statement',
      alternative: this._alternative?.build(ctx),
      condition: this._condition.build(ctx),
      consequence: this._consequence?.build(ctx),
    } as IfStatement;
  }

  override get nodeKind(): string { return 'if_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'if', type: 'if' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    return parts;
  }
}

export type { IfStatementBuilder };

export function if_statement(condition: Builder<ParenthesizedExpression>): IfStatementBuilder {
  return new IfStatementBuilder(condition);
}

export interface IfStatementOptions {
  alternative?: Builder<ElseClause>;
  condition: Builder<ParenthesizedExpression>;
  consequence: Builder<Statement>;
}

export namespace if_statement {
  export function from(options: IfStatementOptions): IfStatementBuilder {
    const b = new IfStatementBuilder(options.condition);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.consequence !== undefined) b.consequence(options.consequence);
    return b;
  }
}
