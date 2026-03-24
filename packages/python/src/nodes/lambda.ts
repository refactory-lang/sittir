import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Lambda, LambdaParameters } from '../types.js';
import { lambda_parameters } from './lambda-parameters.js';
import type { LambdaParametersOptions } from './lambda-parameters.js';


class LambdaBuilder extends Builder<Lambda> {
  private _parameters?: Builder<LambdaParameters>;
  private _body: Builder<Expression>;

  constructor(body: Builder<Expression>) {
    super();
    this._body = body;
  }

  parameters(value: Builder<LambdaParameters>): this {
    this._parameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('lambda');
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Lambda {
    return {
      kind: 'lambda',
      parameters: this._parameters ? this._parameters.build(ctx) : undefined,
      body: this._body.build(ctx),
    } as Lambda;
  }

  override get nodeKind(): 'lambda' { return 'lambda'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'lambda', type: 'lambda' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { LambdaBuilder };

export function lambda(body: Builder<Expression>): LambdaBuilder {
  return new LambdaBuilder(body);
}

export interface LambdaOptions {
  nodeKind: 'lambda';
  parameters?: Builder<LambdaParameters> | Omit<LambdaParametersOptions, 'nodeKind'>;
  body: Builder<Expression>;
}

export namespace lambda {
  export function from(options: Omit<LambdaOptions, 'nodeKind'>): LambdaBuilder {
    const b = new LambdaBuilder(options.body);
    if (options.parameters !== undefined) {
      const _v = options.parameters;
      b.parameters(_v instanceof Builder ? _v : lambda_parameters.from(_v));
    }
    return b;
  }
}
