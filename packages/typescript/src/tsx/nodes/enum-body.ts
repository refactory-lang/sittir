import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComputedPropertyName, EnumAssignment, EnumBody, PrivatePropertyIdentifier, PropertyIdentifier } from '../types.js';


class EnumBodyBuilder extends Builder<EnumBody> {
  private _name: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>[] = [];
  private _children: Builder<EnumAssignment>[] = [];

  constructor() { super(); }

  name(...value: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>[]): this {
    this._name = value;
    return this;
  }

  children(...value: Builder<EnumAssignment>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._name.length > 0) {
      if (this._name.length > 0) parts.push(this.renderChildren(this._name, ', ', ctx));
      parts.push(',');
      parts.push(',');
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumBody {
    return {
      kind: 'enum_body',
      name: this._name.map(c => c.build(ctx)),
      children: this._children.map(c => c.build(ctx)),
    } as EnumBody;
  }

  override get nodeKind(): string { return 'enum_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._name.length > 0) {
      for (const child of this._name) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'name' });
      }
      parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'token', text: ',', type: ',' });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { EnumBodyBuilder };

export function enum_body(): EnumBodyBuilder {
  return new EnumBodyBuilder();
}

export interface EnumBodyOptions {
  name?: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier> | (Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>)[];
  children?: Builder<EnumAssignment> | (Builder<EnumAssignment>)[];
}

export namespace enum_body {
  export function from(options: EnumBodyOptions): EnumBodyBuilder {
    const b = new EnumBodyBuilder();
    if (options.name !== undefined) {
      const _v = options.name;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.name(..._arr);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
