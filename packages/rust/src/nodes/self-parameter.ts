import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Lifetime, MutableSpecifier, Self, SelfParameter } from '../types.js';


class SelfParameterBuilder extends Builder<SelfParameter> {
  private _children: Builder<Lifetime | MutableSpecifier | Self>[] = [];

  constructor(...children: Builder<Lifetime | MutableSpecifier | Self>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { SelfParameterBuilder };

export function self_parameter(...children: Builder<Lifetime | MutableSpecifier | Self>[]): SelfParameterBuilder {
  return new SelfParameterBuilder(...children);
}

export interface SelfParameterOptions {
  children: Builder<Lifetime | MutableSpecifier | Self> | (Builder<Lifetime | MutableSpecifier | Self>)[];
}

export namespace self_parameter {
  export function from(options: SelfParameterOptions): SelfParameterBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new SelfParameterBuilder(..._arr);
    return b;
  }
}
