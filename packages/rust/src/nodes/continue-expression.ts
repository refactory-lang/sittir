import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ContinueExpression, Label } from '../types.js';
import { label } from './label.js';
import type { LabelOptions } from './label.js';


class ContinueExpressionBuilder extends Builder<ContinueExpression> {
  private _children: Builder<Label>[] = [];

  constructor() { super(); }

  children(...value: Builder<Label>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('continue');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ContinueExpression {
    return {
      kind: 'continue_expression',
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as ContinueExpression;
  }

  override get nodeKind(): 'continue_expression' { return 'continue_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'continue', type: 'continue' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ContinueExpressionBuilder };

export function continue_expression(): ContinueExpressionBuilder {
  return new ContinueExpressionBuilder();
}

export interface ContinueExpressionOptions {
  nodeKind: 'continue_expression';
  children?: Builder<Label> | Omit<LabelOptions, 'nodeKind'> | (Builder<Label> | Omit<LabelOptions, 'nodeKind'>)[];
}

export namespace continue_expression {
  export function from(input: Omit<ContinueExpressionOptions, 'nodeKind'> | Builder<Label> | Omit<LabelOptions, 'nodeKind'> | (Builder<Label> | Omit<LabelOptions, 'nodeKind'>)[]): ContinueExpressionBuilder {
    const options: Omit<ContinueExpressionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ContinueExpressionOptions, 'nodeKind'>
      : { children: input } as Omit<ContinueExpressionOptions, 'nodeKind'>;
    const b = new ContinueExpressionBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : label.from(_x)));
    }
    return b;
  }
}
