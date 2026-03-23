import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallSignature, ConstructSignature, ExportStatement, IndexSignature, MethodSignature, ObjectType, PropertySignature } from '../types.js';


class ObjectTypeBuilder extends Builder<ObjectType> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ObjectType {
    return {
      kind: 'object_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ObjectType;
  }

  override get nodeKind(): string { return 'object_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { ObjectTypeBuilder };

export function object_type(): ObjectTypeBuilder {
  return new ObjectTypeBuilder();
}

export interface ObjectTypeOptions {
  children?: Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature> | (Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature>)[];
}

export namespace object_type {
  export function from(options: ObjectTypeOptions): ObjectTypeBuilder {
    const b = new ObjectTypeBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
