import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedExpression, SwitchBody, SwitchStatement } from '../types.js';


class SwitchBuilder extends Builder<SwitchStatement> {
  private _body!: Builder;
  private _value: Builder;

  constructor(value: Builder) {
    super();
    this._value = value;
  }

  body(value: Builder): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      value: this.renderChild(this._value, ctx),
    } as unknown as SwitchStatement;
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

export type { SwitchBuilder };

export function switch_(value: Builder): SwitchBuilder {
  return new SwitchBuilder(value);
}

export interface SwitchStatementOptions {
  body: Builder<SwitchBody>;
  value: Builder<ParenthesizedExpression>;
}

export namespace switch_ {
  export function from(options: SwitchStatementOptions): SwitchBuilder {
    const b = new SwitchBuilder(options.value);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
