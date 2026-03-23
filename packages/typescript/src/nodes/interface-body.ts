import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InterfaceBody } from '../types.js';


class InterfaceBodyBuilder extends BaseBuilder<InterfaceBody> {
  private _children: BaseBuilder[] = [];

  constructor() { super(); }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    return this._children ? this.renderChildren(this._children, ' ', ctx) : '';
  }

  build(ctx?: RenderContext): InterfaceBody {
    return {
      kind: 'interface_body',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as InterfaceBody;
  }

  override get nodeKind(): string { return 'interface_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function interface_body(): InterfaceBodyBuilder {
  return new InterfaceBodyBuilder();
}
