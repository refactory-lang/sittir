import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SwitchBody, SwitchCase, SwitchDefault } from '../types.js';


class SwitchBodyBuilder extends Builder<SwitchBody> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SwitchBody {
    return {
      kind: 'switch_body',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SwitchBody;
  }

  override get nodeKind(): string { return 'switch_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { SwitchBodyBuilder };

export function switch_body(): SwitchBodyBuilder {
  return new SwitchBodyBuilder();
}

export interface SwitchBodyOptions {
  children?: Builder<SwitchCase | SwitchDefault> | (Builder<SwitchCase | SwitchDefault>)[];
}

export namespace switch_body {
  export function from(options: SwitchBodyOptions): SwitchBodyBuilder {
    const b = new SwitchBodyBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
