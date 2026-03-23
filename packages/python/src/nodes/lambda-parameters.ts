import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LambdaParameters, Parameter } from '../types.js';


class LambdaParametersBuilder extends Builder<LambdaParameters> {
  private _children: Builder<Parameter>[] = [];

  constructor(...children: Builder<Parameter>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LambdaParameters {
    return {
      kind: 'lambda_parameters',
      children: this._children.map(c => c.build(ctx)),
    } as LambdaParameters;
  }

  override get nodeKind(): string { return 'lambda_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { LambdaParametersBuilder };

export function lambda_parameters(...children: Builder<Parameter>[]): LambdaParametersBuilder {
  return new LambdaParametersBuilder(...children);
}

export interface LambdaParametersOptions {
  children: Builder<Parameter> | (Builder<Parameter>)[];
}

export namespace lambda_parameters {
  export function from(options: LambdaParametersOptions): LambdaParametersBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new LambdaParametersBuilder(..._arr);
    return b;
  }
}
