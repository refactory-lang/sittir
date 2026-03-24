import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SequenceExpression, Statement, SwitchCase } from '../types.js';
import { sequence_expression } from './sequence-expression.js';
import type { SequenceExpressionOptions } from './sequence-expression.js';


class SwitchCaseBuilder extends Builder<SwitchCase> {
  private _value: Builder<Expression | SequenceExpression>;
  private _body: Builder<Statement>[] = [];

  constructor(value: Builder<Expression | SequenceExpression>) {
    super();
    this._value = value;
  }

  body(...value: Builder<Statement>[]): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('case');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    parts.push(':');
    if (this._body.length > 0) parts.push(this.renderChildren(this._body, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SwitchCase {
    return {
      kind: 'switch_case',
      value: this._value.build(ctx),
      body: this._body.map(c => c.build(ctx)),
    } as SwitchCase;
  }

  override get nodeKind(): 'switch_case' { return 'switch_case'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'case', type: 'case' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._body) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'body' });
    }
    return parts;
  }
}

export type { SwitchCaseBuilder };

export function switch_case(value: Builder<Expression | SequenceExpression>): SwitchCaseBuilder {
  return new SwitchCaseBuilder(value);
}

export interface SwitchCaseOptions {
  nodeKind: 'switch_case';
  value: Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>;
  body?: Builder<Statement> | (Builder<Statement>)[];
}

export namespace switch_case {
  export function from(options: Omit<SwitchCaseOptions, 'nodeKind'>): SwitchCaseBuilder {
    const _ctor = options.value;
    const b = new SwitchCaseBuilder(_ctor instanceof Builder ? _ctor : sequence_expression.from(_ctor));
    if (options.body !== undefined) {
      const _v = options.body;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.body(..._arr);
    }
    return b;
  }
}
