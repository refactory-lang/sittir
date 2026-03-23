import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ContinueExpression, Label } from '../types.js';


class ContinueBuilder extends Builder<ContinueExpression> {
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
      children: this._children[0]?.build(ctx),
    } as ContinueExpression;
  }

  override get nodeKind(): string { return 'continue_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'continue', type: 'continue' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ContinueBuilder };

export function continue_(): ContinueBuilder {
  return new ContinueBuilder();
}

export interface ContinueExpressionOptions {
  children?: Builder<Label> | (Builder<Label>)[];
}

export namespace continue_ {
  export function from(options: ContinueExpressionOptions): ContinueBuilder {
    const b = new ContinueBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
