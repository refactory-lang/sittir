import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractMethodSignature, ClassBody, ClassStaticBlock, Decorator, IndexSignature, MethodDefinition, MethodSignature, PublicFieldDefinition } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';
import { method_definition } from './method-definition.js';
import type { MethodDefinitionOptions } from './method-definition.js';
import { method_signature } from './method-signature.js';
import type { MethodSignatureOptions } from './method-signature.js';
import { class_static_block } from './class-static-block.js';
import type { ClassStaticBlockOptions } from './class-static-block.js';
import { abstract_method_signature } from './abstract-method-signature.js';
import type { AbstractMethodSignatureOptions } from './abstract-method-signature.js';
import { index_signature } from './index-signature.js';
import type { IndexSignatureOptions } from './index-signature.js';
import { public_field_definition } from './public-field-definition.js';
import type { PublicFieldDefinitionOptions } from './public-field-definition.js';


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

  override get nodeKind(): 'class_body' { return 'class_body'; }

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
  nodeKind: 'class_body';
  decorator?: Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'> | (Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'>)[];
  children?: Builder<MethodDefinition | MethodSignature | ClassStaticBlock | AbstractMethodSignature | IndexSignature | PublicFieldDefinition> | MethodDefinitionOptions | MethodSignatureOptions | ClassStaticBlockOptions | AbstractMethodSignatureOptions | IndexSignatureOptions | PublicFieldDefinitionOptions | (Builder<MethodDefinition | MethodSignature | ClassStaticBlock | AbstractMethodSignature | IndexSignature | PublicFieldDefinition> | MethodDefinitionOptions | MethodSignatureOptions | ClassStaticBlockOptions | AbstractMethodSignatureOptions | IndexSignatureOptions | PublicFieldDefinitionOptions)[];
}

export namespace class_body {
  export function from(options: Omit<ClassBodyOptions, 'nodeKind'>): ClassBodyBuilder {
    const b = new ClassBodyBuilder();
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v)));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'method_definition': return method_definition.from(_v);   case 'method_signature': return method_signature.from(_v);   case 'class_static_block': return class_static_block.from(_v);   case 'abstract_method_signature': return abstract_method_signature.from(_v);   case 'index_signature': return index_signature.from(_v);   case 'public_field_definition': return public_field_definition.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
