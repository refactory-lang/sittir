import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SwitchStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SwitchBuilder extends BaseBuilder<SwitchStatement> {
  private _body: Child;
  private _value!: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  value(value: Child): this {
    this._value = value;
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
      body: this.renderChild(this._body, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
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

export function switch_(body: Child): SwitchBuilder {
  return new SwitchBuilder(body);
}
