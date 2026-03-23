import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EmptyStatement, Expression, ForStatement, LexicalDeclaration, SequenceExpression, Statement, VariableDeclaration } from '../types.js';


class ForStatementBuilder extends Builder<ForStatement> {
  private _initializer: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement>;
  private _condition!: Builder<Expression | SequenceExpression | EmptyStatement>;
  private _increment?: Builder<Expression | SequenceExpression>;
  private _body!: Builder<Statement>;

  constructor(initializer: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement>) {
    super();
    this._initializer = initializer;
  }

  condition(value: Builder<Expression | SequenceExpression | EmptyStatement>): this {
    this._condition = value;
    return this;
  }

  increment(value: Builder<Expression | SequenceExpression>): this {
    this._increment = value;
    return this;
  }

  body(value: Builder<Statement>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    parts.push('(');
    if (this._initializer) parts.push(this.renderChild(this._initializer, ctx));
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._increment) parts.push(this.renderChild(this._increment, ctx));
    parts.push(')');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForStatement {
    return {
      kind: 'for_statement',
      initializer: this._initializer.build(ctx),
      condition: this._condition?.build(ctx),
      increment: this._increment?.build(ctx),
      body: this._body?.build(ctx),
    } as ForStatement;
  }

  override get nodeKind(): string { return 'for_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._initializer) parts.push({ kind: 'builder', builder: this._initializer, fieldName: 'initializer' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._increment) parts.push({ kind: 'builder', builder: this._increment, fieldName: 'increment' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForStatementBuilder };

export function for_statement(initializer: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement>): ForStatementBuilder {
  return new ForStatementBuilder(initializer);
}

export interface ForStatementOptions {
  initializer: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement>;
  condition: Builder<Expression | SequenceExpression | EmptyStatement> | string;
  increment?: Builder<Expression | SequenceExpression>;
  body: Builder<Statement>;
}

export namespace for_statement {
  export function from(options: ForStatementOptions): ForStatementBuilder {
    const b = new ForStatementBuilder(options.initializer);
    if (options.condition !== undefined) {
      const _v = options.condition;
      b.condition(typeof _v === 'string' ? new LeafBuilder('empty_statement', _v) : _v);
    }
    if (options.increment !== undefined) b.increment(options.increment);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
