import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedExpression, SwitchBody, SwitchStatement } from '../types.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';
import { switch_body } from './switch-body.js';
import type { SwitchBodyOptions } from './switch-body.js';


class SwitchStatementBuilder extends Builder<SwitchStatement> {
  private _value: Builder<ParenthesizedExpression>;
  private _body!: Builder<SwitchBody>;

  constructor(value: Builder<ParenthesizedExpression>) {
    super();
    this._value = value;
  }

  body(value: Builder<SwitchBody>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('switch');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SwitchStatement {
    return {
      kind: 'switch_statement',
      value: this._value.build(ctx),
      body: this._body ? this._body.build(ctx) : undefined,
    } as SwitchStatement;
  }

  override get nodeKind(): 'switch_statement' { return 'switch_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'switch', type: 'switch' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { SwitchStatementBuilder };

export function switch_statement(value: Builder<ParenthesizedExpression>): SwitchStatementBuilder {
  return new SwitchStatementBuilder(value);
}

export interface SwitchStatementOptions {
  nodeKind: 'switch_statement';
  value: Builder<ParenthesizedExpression> | Omit<ParenthesizedExpressionOptions, 'nodeKind'>;
  body: Builder<SwitchBody> | Omit<SwitchBodyOptions, 'nodeKind'>;
}

export namespace switch_statement {
  export function from(options: Omit<SwitchStatementOptions, 'nodeKind'>): SwitchStatementBuilder {
    const _ctor = options.value;
    const b = new SwitchStatementBuilder(_ctor instanceof Builder ? _ctor : parenthesized_expression.from(_ctor));
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : switch_body.from(_v));
    }
    return b;
  }
}
