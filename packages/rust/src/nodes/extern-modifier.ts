import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExternModifier, StringLiteral } from '../types.js';


class ExternModifierBuilder extends Builder<ExternModifier> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('extern');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExternModifier {
    return {
      kind: 'extern_modifier',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ExternModifier;
  }

  override get nodeKind(): string { return 'extern_modifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'extern', type: 'extern' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ExternModifierBuilder };

export function extern_modifier(): ExternModifierBuilder {
  return new ExternModifierBuilder();
}

export interface ExternModifierOptions {
  children?: Builder<StringLiteral> | (Builder<StringLiteral>)[];
}

export namespace extern_modifier {
  export function from(options: ExternModifierOptions): ExternModifierBuilder {
    const b = new ExternModifierBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
