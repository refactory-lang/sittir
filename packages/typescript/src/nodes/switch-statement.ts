import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedExpression, SwitchBody, SwitchStatement } from '../types.js';


class SwitchStatementBuilder extends Builder<SwitchStatement> {
  private _body!: Builder<SwitchBody>;
  private _value: Builder<ParenthesizedExpression>;

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
      body: this._body?.build(ctx),
      value: this._value.build(ctx),
    } as SwitchStatement;
  }

  override get nodeKind(): string { return 'switch_statement'; }

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
  body: Builder<SwitchBody>;
  value: Builder<ParenthesizedExpression>;
}

export namespace switch_statement {
  export function from(options: SwitchStatementOptions): SwitchStatementBuilder {
    const b = new SwitchStatementBuilder(options.value);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
