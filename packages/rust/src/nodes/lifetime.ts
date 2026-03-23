import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, Lifetime } from '../types.js';


class LifetimeBuilder extends Builder<Lifetime> {
  private _children: Builder<Identifier>[] = [];

  constructor(children: Builder<Identifier>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('\'');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Lifetime {
    return {
      kind: 'lifetime',
      children: this._children[0]?.build(ctx),
    } as Lifetime;
  }

  override get nodeKind(): string { return 'lifetime'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '\'', type: '\'' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { LifetimeBuilder };

export function lifetime(children: Builder<Identifier>): LifetimeBuilder {
  return new LifetimeBuilder(children);
}

export interface LifetimeOptions {
  children: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace lifetime {
  export function from(options: LifetimeOptions): LifetimeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new LifetimeBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    return b;
  }
}
