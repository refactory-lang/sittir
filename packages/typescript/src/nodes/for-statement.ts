import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EmptyStatement, Expression, ForStatement, LexicalDeclaration, SequenceExpression, Statement, VariableDeclaration } from '../types.js';


class ForStatementBuilder extends Builder<ForStatement> {
  private _body!: Builder<Statement>;
  private _condition: Builder<EmptyStatement | Expression | SequenceExpression>[] = [];
  private _increment?: Builder<Expression | SequenceExpression>;
  private _initializer: Builder<EmptyStatement | Expression | LexicalDeclaration | SequenceExpression | VariableDeclaration>;

  constructor(initializer: Builder<EmptyStatement | Expression | LexicalDeclaration | SequenceExpression | VariableDeclaration>) {
    super();
    this._initializer = initializer;
  }

  body(value: Builder<Statement>): this {
    this._body = value;
    return this;
  }

  condition(...value: Builder<EmptyStatement | Expression | SequenceExpression>[]): this {
    this._condition = value;
    return this;
  }

  increment(value: Builder<Expression | SequenceExpression>): this {
    this._increment = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    parts.push('(');
    if (this._initializer) parts.push(this.renderChild(this._initializer, ctx));
    if (this._condition.length > 0) parts.push(this.renderChildren(this._condition, ', ', ctx));
    if (this._increment) parts.push(this.renderChild(this._increment, ctx));
    parts.push(')');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForStatement {
    return {
      kind: 'for_statement',
      body: this._body?.build(ctx),
      condition: this._condition.map(c => c.build(ctx)),
      increment: this._increment?.build(ctx),
      initializer: this._initializer.build(ctx),
    } as ForStatement;
  }

  override get nodeKind(): string { return 'for_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._initializer) parts.push({ kind: 'builder', builder: this._initializer, fieldName: 'initializer' });
    for (const child of this._condition) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'condition' });
    }
    if (this._increment) parts.push({ kind: 'builder', builder: this._increment, fieldName: 'increment' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForStatementBuilder };

export function for_statement(initializer: Builder<EmptyStatement | Expression | LexicalDeclaration | SequenceExpression | VariableDeclaration>): ForStatementBuilder {
  return new ForStatementBuilder(initializer);
}

export interface ForStatementOptions {
  body: Builder<Statement>;
  condition: Builder<EmptyStatement | Expression | SequenceExpression> | (Builder<EmptyStatement | Expression | SequenceExpression>)[];
  increment?: Builder<Expression | SequenceExpression>;
  initializer: Builder<EmptyStatement | Expression | LexicalDeclaration | SequenceExpression | VariableDeclaration>;
}

export namespace for_statement {
  export function from(options: ForStatementOptions): ForStatementBuilder {
    const b = new ForStatementBuilder(options.initializer);
    if (options.body !== undefined) b.body(options.body);
    if (options.condition !== undefined) {
      const _v = options.condition;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.condition(..._arr);
    }
    if (options.increment !== undefined) b.increment(options.increment);
    return b;
  }
}
