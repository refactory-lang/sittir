import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ElseClause, IfStatement, ParenthesizedExpression, Statement } from '../types.js';


class IfBuilder extends Builder<IfStatement> {
  private _alternative?: Builder;
  private _condition: Builder;
  private _consequence!: Builder;

  constructor(condition: Builder) {
    super();
    this._condition = condition;
  }

  alternative(value: Builder): this {
    this._alternative = value;
    return this;
  }

  consequence(value: Builder): this {
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
      alternative: this._alternative ? this.renderChild(this._alternative, ctx) : undefined,
      condition: this.renderChild(this._condition, ctx),
      consequence: this._consequence ? this.renderChild(this._consequence, ctx) : undefined,
    } as unknown as IfStatement;
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

export type { IfBuilder };

export function if_(condition: Builder): IfBuilder {
  return new IfBuilder(condition);
}

export interface IfStatementOptions {
  alternative?: Builder<ElseClause>;
  condition: Builder<ParenthesizedExpression>;
  consequence: Builder<Statement>;
}

export namespace if_ {
  export function from(options: IfStatementOptions): IfBuilder {
    const b = new IfBuilder(options.condition);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.consequence !== undefined) b.consequence(options.consequence);
    return b;
  }
}
