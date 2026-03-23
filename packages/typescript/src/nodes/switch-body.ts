import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SwitchBody } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SwitchBodyBuilder extends BaseBuilder<SwitchBody> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SwitchBody {
    return {
      kind: 'switch_body',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SwitchBody;
  }

  override get nodeKind(): string { return 'switch_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export function switch_body(): SwitchBodyBuilder {
  return new SwitchBodyBuilder();
}
