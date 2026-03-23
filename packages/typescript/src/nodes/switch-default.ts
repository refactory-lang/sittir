import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SwitchDefault } from '../types.js';


class SwitchDefaultBuilder extends BaseBuilder<SwitchDefault> {
  private _body: BaseBuilder[] = [];

  constructor() { super(); }

  body(value: BaseBuilder[]): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('default');
    parts.push(':');
    if (this._body.length > 0) parts.push(this.renderChildren(this._body, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SwitchDefault {
    return {
      kind: 'switch_default',
      body: this._body.map(c => this.renderChild(c, ctx)),
    } as unknown as SwitchDefault;
  }

  override get nodeKind(): string { return 'switch_default'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'default', type: 'default' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._body) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'body' });
    }
    return parts;
  }
}

export function switch_default(): SwitchDefaultBuilder {
  return new SwitchDefaultBuilder();
}
