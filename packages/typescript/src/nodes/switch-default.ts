import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SwitchDefault } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SwitchDefaultBuilder extends BaseBuilder<SwitchDefault> {
  private _body: Child[] = [];

  constructor() { super(); }

  body(value: Child[]): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._body.length > 0) {
      parts.push('{');
      parts.push(this.renderChildren(this._body, '\n', ctx));
      parts.push('}');
    }
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

export function switch_default(): SwitchDefaultBuilder {
  return new SwitchDefaultBuilder();
}
