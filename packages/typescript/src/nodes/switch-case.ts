import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SwitchCase } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SwitchCaseBuilder extends BaseBuilder<SwitchCase> {
  private _body: Child[] = [];
  private _value: Child;

  constructor(value: Child) {
    super();
    this._value = value;
  }

  body(value: Child[]): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._body.length > 0) {
      parts.push('{');
      parts.push(this.renderChildren(this._body, '\n', ctx));
      parts.push('}');
    }
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
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    if (this._body.length > 0) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      for (const child of this._body) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'body' });
      }
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    return parts;
  }
}

export function switch_case(value: Child): SwitchCaseBuilder {
  return new SwitchCaseBuilder(value);
}
