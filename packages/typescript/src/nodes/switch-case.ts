import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SwitchCase } from '../types.js';


class SwitchCaseBuilder extends BaseBuilder<SwitchCase> {
  private _body: BaseBuilder[] = [];
  private _value: BaseBuilder;

  constructor(value: BaseBuilder) {
    super();
    this._value = value;
  }

  body(value: BaseBuilder[]): this {
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

export function switch_case(value: BaseBuilder): SwitchCaseBuilder {
  return new SwitchCaseBuilder(value);
}
