import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractMethodSignature, ClassBody, ClassStaticBlock, Decorator, IndexSignature, MethodDefinition, MethodSignature, PublicFieldDefinition } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';


class ClassBodyBuilder extends Builder<ClassBody> {
  private _decorator: Builder<Decorator>[] = [];
  private _children: Builder<MethodDefinition | MethodSignature | ClassStaticBlock | AbstractMethodSignature | IndexSignature | PublicFieldDefinition>[] = [];

  constructor() { super(); }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  children(...value: Builder<MethodDefinition | MethodSignature | ClassStaticBlock | AbstractMethodSignature | IndexSignature | PublicFieldDefinition>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClassBody {
    return {
      kind: 'class_body',
      decorator: this._decorator.map(c => c.build(ctx)),
      children: this._children.map(c => c.build(ctx)),
    } as ClassBody;
  }

  override get nodeKind(): string { return 'class_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { ClassBodyBuilder };

export function class_body(): ClassBodyBuilder {
  return new ClassBodyBuilder();
}

export interface ClassBodyOptions {
  decorator?: Builder<Decorator> | DecoratorOptions | (Builder<Decorator> | DecoratorOptions)[];
  children?: Builder<MethodDefinition | MethodSignature | ClassStaticBlock | AbstractMethodSignature | IndexSignature | PublicFieldDefinition> | (Builder<MethodDefinition | MethodSignature | ClassStaticBlock | AbstractMethodSignature | IndexSignature | PublicFieldDefinition>)[];
}

export namespace class_body {
  export function from(options: ClassBodyOptions): ClassBodyBuilder {
    const b = new ClassBodyBuilder();
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v as DecoratorOptions)));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
