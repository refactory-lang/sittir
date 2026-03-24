import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { Lifetime, MutableSpecifier, Self, SelfParameter } from '../types.js';
import { lifetime } from './lifetime.js';
import type { LifetimeOptions } from './lifetime.js';


class SelfParameterBuilder extends Builder<SelfParameter> {
  private _children: Builder<Lifetime | MutableSpecifier | Self>[] = [];

  constructor(...children: Builder<Lifetime | MutableSpecifier | Self>[]) {
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

  override get nodeKind(): 'self_parameter' { return 'self_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    return parts;
  }
}

export type { SelfParameterBuilder };

export function self_parameter(...children: Builder<Lifetime | MutableSpecifier | Self>[]): SelfParameterBuilder {
  return new SelfParameterBuilder(...children);
}

export interface SelfParameterOptions {
  nodeKind: 'self_parameter';
  children?: Builder<Lifetime | MutableSpecifier | Self> | LeafOptions<'mutable_specifier'> | LeafOptions<'self'> | LifetimeOptions | (Builder<Lifetime | MutableSpecifier | Self> | LeafOptions<'mutable_specifier'> | LeafOptions<'self'> | LifetimeOptions)[];
}

export namespace self_parameter {
  export function from(input: Omit<SelfParameterOptions, 'nodeKind'> | Builder<Lifetime | MutableSpecifier | Self> | LeafOptions<'mutable_specifier'> | LeafOptions<'self'> | LifetimeOptions | (Builder<Lifetime | MutableSpecifier | Self> | LeafOptions<'mutable_specifier'> | LeafOptions<'self'> | LifetimeOptions)[]): SelfParameterBuilder {
    const options: Omit<SelfParameterOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<SelfParameterOptions, 'nodeKind'>
      : { children: input } as Omit<SelfParameterOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new SelfParameterBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'lifetime': return lifetime.from(_v);   case 'mutable_specifier': return new LeafBuilder('mutable_specifier', (_v as LeafOptions).text ?? 'mut');   case 'self': return new LeafBuilder('self', (_v as LeafOptions).text ?? 'self'); } throw new Error('unreachable'); }));
    return b;
  }
}
