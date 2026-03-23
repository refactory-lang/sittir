import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallSignature, ConstructSignature, ExportStatement, IndexSignature, InterfaceBody, MethodSignature, PropertySignature } from '../types.js';


class InterfaceBodyBuilder extends Builder<InterfaceBody> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    return this._children ? this.renderChildren(this._children, ' ', ctx) : '';
  }

  build(ctx?: RenderContext): InterfaceBody {
    return {
      kind: 'interface_body',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as InterfaceBody;
  }

  override get nodeKind(): string { return 'interface_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { InterfaceBodyBuilder };

export function interface_body(): InterfaceBodyBuilder {
  return new InterfaceBodyBuilder();
}

export interface InterfaceBodyOptions {
  children?: Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature> | (Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature>)[];
}

export namespace interface_body {
  export function from(options: InterfaceBodyOptions): InterfaceBodyBuilder {
    const b = new InterfaceBodyBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
