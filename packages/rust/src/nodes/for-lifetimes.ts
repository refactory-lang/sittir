import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ForLifetimes, Lifetime } from '../types.js';
import { lifetime } from './lifetime.js';
import type { LifetimeOptions } from './lifetime.js';


class ForLifetimesBuilder extends Builder<ForLifetimes> {
  private _children: Builder<Lifetime>[] = [];

  constructor(...children: Builder<Lifetime>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    parts.push('<');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForLifetimes {
    return {
      kind: 'for_lifetimes',
      children: this._children.map(c => c.build(ctx)),
    } as ForLifetimes;
  }

  override get nodeKind(): 'for_lifetimes' { return 'for_lifetimes'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    parts.push({ kind: 'token', text: '<', type: '<' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { ForLifetimesBuilder };

export function for_lifetimes(...children: Builder<Lifetime>[]): ForLifetimesBuilder {
  return new ForLifetimesBuilder(...children);
}

export interface ForLifetimesOptions {
  nodeKind: 'for_lifetimes';
  children?: Builder<Lifetime> | Omit<LifetimeOptions, 'nodeKind'> | (Builder<Lifetime> | Omit<LifetimeOptions, 'nodeKind'>)[];
}

export namespace for_lifetimes {
  export function from(input: Omit<ForLifetimesOptions, 'nodeKind'> | Builder<Lifetime> | Omit<LifetimeOptions, 'nodeKind'> | (Builder<Lifetime> | Omit<LifetimeOptions, 'nodeKind'>)[]): ForLifetimesBuilder {
    const options: Omit<ForLifetimesOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ForLifetimesOptions, 'nodeKind'>
      : { children: input } as Omit<ForLifetimesOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ForLifetimesBuilder(..._arr.map(_v => _v instanceof Builder ? _v : lifetime.from(_v)));
    return b;
  }
}
