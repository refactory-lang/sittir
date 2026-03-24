import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, ConstParameter, LifetimeParameter, Metavariable, TypeParameter, TypeParameters } from '../types.js';
import { attribute } from './attribute-item.js';
import type { AttributeItemOptions } from './attribute-item.js';
import { type_parameter } from './type-parameter.js';
import type { TypeParameterOptions } from './type-parameter.js';
import { lifetime_parameter } from './lifetime-parameter.js';
import type { LifetimeParameterOptions } from './lifetime-parameter.js';
import { const_parameter } from './const-parameter.js';
import type { ConstParameterOptions } from './const-parameter.js';


class TypeParametersBuilder extends Builder<TypeParameters> {
  private _children: Builder<AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter>[] = [];

  constructor(...children: Builder<AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    if (this._children[3]) parts.push(this.renderChild(this._children[3]!, ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameters {
    return {
      kind: 'type_parameters',
      children: this._children.map(c => c.build(ctx)),
    } as TypeParameters;
  }

  override get nodeKind(): 'type_parameters' { return 'type_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '<', type: '<' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    if (this._children[3]) parts.push({ kind: 'builder', builder: this._children[3]! });
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { TypeParametersBuilder };

export function type_parameters(...children: Builder<AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter>[]): TypeParametersBuilder {
  return new TypeParametersBuilder(...children);
}

export interface TypeParametersOptions {
  nodeKind: 'type_parameters';
  children?: Builder<AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter> | AttributeItemOptions | TypeParameterOptions | LifetimeParameterOptions | ConstParameterOptions | (Builder<AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter> | AttributeItemOptions | TypeParameterOptions | LifetimeParameterOptions | ConstParameterOptions)[];
}

export namespace type_parameters {
  export function from(input: Omit<TypeParametersOptions, 'nodeKind'> | Builder<AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter> | AttributeItemOptions | TypeParameterOptions | LifetimeParameterOptions | ConstParameterOptions | (Builder<AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter> | AttributeItemOptions | TypeParameterOptions | LifetimeParameterOptions | ConstParameterOptions)[]): TypeParametersBuilder {
    const options: Omit<TypeParametersOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TypeParametersOptions, 'nodeKind'>
      : { children: input } as Omit<TypeParametersOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new TypeParametersBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'attribute_item': return attribute.from(_v);   case 'type_parameter': return type_parameter.from(_v);   case 'lifetime_parameter': return lifetime_parameter.from(_v);   case 'const_parameter': return const_parameter.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
