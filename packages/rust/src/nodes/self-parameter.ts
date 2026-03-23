import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MutableSpecifier, Self, SelfParameter } from '../types.js';


class SelfParameterBuilder extends Builder<SelfParameter> {
  private _children: Builder<MutableSpecifier | Self>[] = [];

  constructor(...children: Builder<MutableSpecifier | Self>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SelfParameter {
    return {
      kind: 'self_parameter',
      children: this._children.map(c => c.build(ctx)),
    } as SelfParameter;
  }

  override get nodeKind(): string { return 'self_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    return parts;
  }
}

export type { SelfParameterBuilder };

export function self_parameter(...children: Builder<MutableSpecifier | Self>[]): SelfParameterBuilder {
  return new SelfParameterBuilder(...children);
}

export interface SelfParameterOptions {
  children: Builder<MutableSpecifier | Self> | (Builder<MutableSpecifier | Self>)[];
}

export namespace self_parameter {
  export function from(options: SelfParameterOptions): SelfParameterBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new SelfParameterBuilder(..._arr);
    return b;
  }
}
