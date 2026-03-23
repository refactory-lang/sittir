import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SequenceExpression, Statement, SwitchCase } from '../types.js';


class SwitchCaseBuilder extends Builder<SwitchCase> {
  private _body: Builder[] = [];
  private _value: Builder;

  constructor(value: Builder) {
    super();
    this._value = value;
  }

  body(...value: Builder[]): this {
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
      body: this._body.map(c => this.renderChild(c, ctx)),
      value: this.renderChild(this._value, ctx),
    } as unknown as SwitchCase;
  }

  override get nodeKind(): string { return 'switch_case'; }

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

export function switch_case(value: Builder): SwitchCaseBuilder {
  return new SwitchCaseBuilder(value);
}

export interface SwitchCaseOptions {
  body?: Builder<Statement> | (Builder<Statement>)[];
  value: Builder<Expression | SequenceExpression>;
}

export namespace switch_case {
  export function from(options: SwitchCaseOptions): SwitchCaseBuilder {
    const b = new SwitchCaseBuilder(options.value);
    if (options.body !== undefined) {
      const _v = options.body;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.body(..._arr);
    }
    return b;
  }
}
