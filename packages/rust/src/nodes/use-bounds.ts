import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Lifetime, TypeIdentifier, UseBounds } from '../types.js';
import { lifetime } from './lifetime.js';
import type { LifetimeOptions } from './lifetime.js';


class UseBoundsBuilder extends Builder<UseBounds> {
  private _children: Builder<Lifetime | TypeIdentifier>[] = [];

  constructor() { super(); }

  children(...value: Builder<Lifetime | TypeIdentifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('use');
    parts.push('<');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseBounds {
    return {
      kind: 'use_bounds',
      children: this._children.map(c => c.build(ctx)),
    } as UseBounds;
  }

  override get nodeKind(): 'use_bounds' { return 'use_bounds'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'use', type: 'use' });
    parts.push({ kind: 'token', text: '<', type: '<' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { UseBoundsBuilder };

export function use_bounds(): UseBoundsBuilder {
  return new UseBoundsBuilder();
}

export interface UseBoundsOptions {
  nodeKind: 'use_bounds';
  children?: Builder<Lifetime | TypeIdentifier> | string | Omit<LifetimeOptions, 'nodeKind'> | (Builder<Lifetime | TypeIdentifier> | string | Omit<LifetimeOptions, 'nodeKind'>)[];
}

export namespace use_bounds {
  export function from(input: Omit<UseBoundsOptions, 'nodeKind'> | Builder<Lifetime | TypeIdentifier> | string | Omit<LifetimeOptions, 'nodeKind'> | (Builder<Lifetime | TypeIdentifier> | string | Omit<LifetimeOptions, 'nodeKind'>)[]): UseBoundsBuilder {
    const options: Omit<UseBoundsOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<UseBoundsOptions, 'nodeKind'>
      : { children: input } as Omit<UseBoundsOptions, 'nodeKind'>;
    const b = new UseBoundsBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('type_identifier', _x) : _x instanceof Builder ? _x : lifetime.from(_x)));
    }
    return b;
  }
}
