import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FormalParameters, OptionalParameter, RequiredParameter } from '../types.js';
import { required_parameter } from './required-parameter.js';
import type { RequiredParameterOptions } from './required-parameter.js';
import { optional_parameter } from './optional-parameter.js';
import type { OptionalParameterOptions } from './optional-parameter.js';


class FormalParametersBuilder extends Builder<FormalParameters> {
  private _children: Builder<RequiredParameter | OptionalParameter>[] = [];

  constructor() { super(); }

  children(...value: Builder<RequiredParameter | OptionalParameter>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FormalParameters {
    return {
      kind: 'formal_parameters',
      children: this._children.map(c => c.build(ctx)),
    } as FormalParameters;
  }

  override get nodeKind(): 'formal_parameters' { return 'formal_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { FormalParametersBuilder };

export function formal_parameters(): FormalParametersBuilder {
  return new FormalParametersBuilder();
}

export interface FormalParametersOptions {
  nodeKind: 'formal_parameters';
  children?: Builder<RequiredParameter | OptionalParameter> | RequiredParameterOptions | OptionalParameterOptions | (Builder<RequiredParameter | OptionalParameter> | RequiredParameterOptions | OptionalParameterOptions)[];
}

export namespace formal_parameters {
  export function from(input: Omit<FormalParametersOptions, 'nodeKind'> | Builder<RequiredParameter | OptionalParameter> | RequiredParameterOptions | OptionalParameterOptions | (Builder<RequiredParameter | OptionalParameter> | RequiredParameterOptions | OptionalParameterOptions)[]): FormalParametersBuilder {
    const options: Omit<FormalParametersOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<FormalParametersOptions, 'nodeKind'>
      : { children: input } as Omit<FormalParametersOptions, 'nodeKind'>;
    const b = new FormalParametersBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'required_parameter': return required_parameter.from(_v);   case 'optional_parameter': return optional_parameter.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
