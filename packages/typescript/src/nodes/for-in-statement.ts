import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Expression, ForInStatement, Identifier, MemberExpression, NonNullExpression, ObjectPattern, ParenthesizedExpression, SequenceExpression, Statement, SubscriptExpression, Undefined } from '../types.js';
import { member_expression } from './member-expression.js';
import type { MemberExpressionOptions } from './member-expression.js';
import { subscript_expression } from './subscript-expression.js';
import type { SubscriptExpressionOptions } from './subscript-expression.js';
import { object_pattern } from './object-pattern.js';
import type { ObjectPatternOptions } from './object-pattern.js';
import { array_pattern } from './array-pattern.js';
import type { ArrayPatternOptions } from './array-pattern.js';
import { non_null_expression } from './non-null-expression.js';
import type { NonNullExpressionOptions } from './non-null-expression.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';
import { sequence_expression } from './sequence-expression.js';
import type { SequenceExpressionOptions } from './sequence-expression.js';


class ForInStatementBuilder extends Builder<ForInStatement> {
  private _left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>;
  private _kind?: Builder;
  private _value?: Builder<Expression>;
  private _operator!: Builder;
  private _right!: Builder<Expression | SequenceExpression>;
  private _body!: Builder<Statement>;

  constructor(left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>) {
    super();
    this._left = left;
  }

  kind(value: Builder): this {
    this._kind = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  right(value: Builder<Expression | SequenceExpression>): this {
    this._right = value;
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
    if (this._kind) parts.push(this.renderChild(this._kind, ctx));
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    parts.push(')');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForInStatement {
    return {
      kind: 'for_in_statement',
      left: this._left.build(ctx),
      value: this._value ? this._value.build(ctx) : undefined,
      operator: this._operator ? this.buildChild(this._operator, ctx) : undefined,
      right: this._right ? this._right.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
    } as ForInStatement;
  }

  override get nodeKind(): 'for_in_statement' { return 'for_in_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._kind) parts.push({ kind: 'builder', builder: this._kind, fieldName: 'kind' });
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForInStatementBuilder };

export function for_in_statement(left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>): ForInStatementBuilder {
  return new ForInStatementBuilder(left);
}

export interface ForInStatementOptions {
  nodeKind: 'for_in_statement';
  left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression> | MemberExpressionOptions | SubscriptExpressionOptions | ObjectPatternOptions | ArrayPatternOptions | NonNullExpressionOptions | ParenthesizedExpressionOptions;
  kind?: Builder;
  value?: Builder<Expression>;
  operator: Builder;
  right: Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>;
  body: Builder<Statement>;
}

export namespace for_in_statement {
  export function from(options: Omit<ForInStatementOptions, 'nodeKind'>): ForInStatementBuilder {
    const _raw = options.left;
    let _ctor: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'member_expression': _ctor = member_expression.from(_raw); break;
        case 'subscript_expression': _ctor = subscript_expression.from(_raw); break;
        case 'object_pattern': _ctor = object_pattern.from(_raw); break;
        case 'array_pattern': _ctor = array_pattern.from(_raw); break;
        case 'non_null_expression': _ctor = non_null_expression.from(_raw); break;
        case 'parenthesized_expression': _ctor = parenthesized_expression.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ForInStatementBuilder(_ctor);
    if (options.kind !== undefined) b.kind(options.kind);
    if (options.value !== undefined) b.value(options.value);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) {
      const _v = options.right;
      b.right(_v instanceof Builder ? _v : sequence_expression.from(_v));
    }
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
