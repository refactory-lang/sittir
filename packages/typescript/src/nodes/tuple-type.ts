import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OptionalParameter, OptionalType, RequiredParameter, RestType, TupleType, Type } from '../types.js';
import { required_parameter } from './required-parameter.js';
import type { RequiredParameterOptions } from './required-parameter.js';
import { optional_parameter } from './optional-parameter.js';
import type { OptionalParameterOptions } from './optional-parameter.js';
import { optional_type } from './optional-type.js';
import type { OptionalTypeOptions } from './optional-type.js';
import { rest_type } from './rest-type.js';
import type { RestTypeOptions } from './rest-type.js';


class TupleTypeBuilder extends Builder<TupleType> {
  private _children: Builder<RequiredParameter | OptionalParameter | OptionalType | RestType | Type>[] = [];

  constructor() { super(); }

  children(...value: Builder<RequiredParameter | OptionalParameter | OptionalType | RestType | Type>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TupleType {
    return {
      kind: 'tuple_type',
      children: this._children.map(c => c.build(ctx)),
    } as TupleType;
  }

  override get nodeKind(): 'tuple_type' { return 'tuple_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { TupleTypeBuilder };

export function tuple_type(): TupleTypeBuilder {
  return new TupleTypeBuilder();
}

export interface TupleTypeOptions {
  nodeKind: 'tuple_type';
  children?: Builder<RequiredParameter | OptionalParameter | OptionalType | RestType | Type> | RequiredParameterOptions | OptionalParameterOptions | OptionalTypeOptions | RestTypeOptions | (Builder<RequiredParameter | OptionalParameter | OptionalType | RestType | Type> | RequiredParameterOptions | OptionalParameterOptions | OptionalTypeOptions | RestTypeOptions)[];
}

export namespace tuple_type {
  export function from(input: Omit<TupleTypeOptions, 'nodeKind'> | Builder<RequiredParameter | OptionalParameter | OptionalType | RestType | Type> | RequiredParameterOptions | OptionalParameterOptions | OptionalTypeOptions | RestTypeOptions | (Builder<RequiredParameter | OptionalParameter | OptionalType | RestType | Type> | RequiredParameterOptions | OptionalParameterOptions | OptionalTypeOptions | RestTypeOptions)[]): TupleTypeBuilder {
    const options: Omit<TupleTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TupleTypeOptions, 'nodeKind'>
      : { children: input } as Omit<TupleTypeOptions, 'nodeKind'>;
    const b = new TupleTypeBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'required_parameter': return required_parameter.from(_v);   case 'optional_parameter': return optional_parameter.from(_v);   case 'optional_type': return optional_type.from(_v);   case 'rest_type': return rest_type.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
